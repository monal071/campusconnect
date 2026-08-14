import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../utils/mongodb";
import { cache, cacheKeys, cacheTTL, invalidateCache } from "../../lib/redis";
import { getPaginationParams, paginatedQuery } from "../../lib/pagination";
import { z } from "zod";
import { ObjectId } from "mongodb";

const eventSchema = z.object({
  title: z.string().min(1, "Event title is required").max(200, "Title too long"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(3000, "Description too long"),
  date: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: "Invalid event date" }),
  location: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  maxAttendees: z.number().int().positive().optional(),
  isOnline: z.boolean().optional().default(false),
  meetingUrl: z.string().url("Invalid meeting URL").optional().or(z.literal("")),
  imageUrl: z.string().optional(),
});

const COLLECTION = "events";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { page, limit } = getPaginationParams(req);

      const cacheKey = cacheKeys.events(page, limit);
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.status(200).json(cached);
      }

      const client = await clientPromise;
      const db = client.db();

      const queryResult = await paginatedQuery(
        db.collection(COLLECTION),
        { status: "approved" },
        { page, limit, sort: { createdAt: -1 } }
      );

      const validEvents = (queryResult.data || []).filter(
        (event) =>
          event &&
          typeof event === "object" &&
          event.title &&
          event.description !== undefined
      );

      const response = {
        success: true,
        events: validEvents,
        pagination: {
          page,
          limit,
          total: queryResult.total,
          totalPages: queryResult.totalPages,
          hasMore: queryResult.hasMore,
        },
      };

      await cache.set(cacheKey, response, cacheTTL.events);
      return res.status(200).json(response);
    } catch (error) {
      console.error("Events GET error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const parse = eventSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          error: "Validation failed",
          message: parse.error.errors[0].message,
          details: parse.error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        });
      }

      const event = parse.data;
      const client = await clientPromise;
      const db = client.db();

      if (session.user.role === "admin") {
        await db.collection(COLLECTION).insertOne({
          ...event,
          joined: [],
          createdBy: session.user.id,
          createdAt: new Date(),
          status: "approved",
        });
        return res.status(201).json({ message: "Event added successfully" });
      } else {
        await db.collection("pending_events").insertOne({
          ...event,
          joined: [],
          createdBy: session.user.id,
          createdAt: new Date(),
          status: "pending",
          submittedBy: {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
          },
        });

        const admins = await db.collection("users").find({ role: "admin" }).toArray();
        const notifications = admins.map((admin) => ({
          userId: admin._id.toString(),
          type: "event",
          message: `New event "${event.title}" submitted by ${session.user.name} awaiting approval`,
          link: "/admin",
          read: false,
          createdAt: new Date(),
        }));

        if (notifications.length > 0) {
          await db.collection("notifications").insertMany(notifications);
        }

        return res.status(201).json({
          message: "Event submitted for approval. You will be notified once reviewed.",
          isPending: true,
        });
      }
    } catch (error) {
      console.error("Event POST error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) return res.status(401).json({ error: "Not authenticated" });

      const { id, eventId } = req.body;
      const deleteId = id || eventId;
      if (!deleteId) {
        return res.status(400).json({ error: "Missing event ID" });
      }

      const client = await clientPromise;
      const db = client.db();
      const result = await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(deleteId) });

      if (result.deletedCount > 0) {
        await invalidateCache.events?.();
        return res.status(200).json({ success: true, message: "Event deleted" });
      } else {
        return res.status(404).json({ success: false, error: "Event not found" });
      }
    } catch (error) {
      console.error("Event DELETE error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "PUT") {
    try {
      const { eventId, userId } = req.body;
      if (!eventId || !userId)
        return res.status(400).json({ error: "Missing eventId or userId" });

      const client = await clientPromise;
      const db = client.db();
      const event = await db.collection(COLLECTION).findOne({ _id: new ObjectId(eventId) });
      if (!event) return res.status(404).json({ error: "Event not found" });

      const joined = Array.isArray(event.joined) ? event.joined : [];
      if (!joined.includes(userId)) {
        joined.push(userId);
        await db.collection(COLLECTION).updateOne(
          { _id: new ObjectId(eventId) },
          { $set: { joined } }
        );

        try {
          await db.collection("userActivity").insertOne({
            userId,
            type: "event_join",
            content: `Joined event: ${event.title || eventId}`,
            eventId,
            timestamp: new Date(),
            icon: "EventIcon",
          });
        } catch (err) {
          console.error("Failed to record user activity for event join:", err);
        }

        try {
          await invalidateCache.events?.();
        } catch (err) {
          console.error("Failed to invalidate events cache after join:", err);
        }
      }

      return res.status(200).json({ success: true, joinedCount: joined.length });
    } catch (error) {
      console.error("Event PUT error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).end();
}
