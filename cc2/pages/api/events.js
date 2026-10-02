import { setEventAttendance } from "../../lib/event-attendance";
import { sendApiError } from "../../lib/api-errors";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../utils/mongodb";
import { cache, cacheKeys, cacheTTL, invalidateCache } from "../../lib/redis";
import { getPaginationParams, paginatedQuery } from "../../lib/pagination";
import { z } from "zod";
import { ObjectId } from "mongodb";

export const eventSchema = z.object({
  title: z.string().min(1, "Event title is required").max(200, "Title too long"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(3000, "Description too long"),
  date: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: "Invalid event date" }),
  location: z.string().max(300).optional(),
  type: z.string().max(50).optional(),
  link: z.string().url().optional().or(z.literal("")),
  category: z.string().optional(),
  tags: z.preprocess(value => typeof value === "string" ? value.split(",").map(tag => tag.trim()).filter(Boolean) : value, z.array(z.string().max(50)).max(20).optional().default([])),
  maxAttendees: z.preprocess(value => value === "" || value == null ? undefined : Number(value), z.number().int().positive().optional()),
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
        { status: "approved", title: { $type: "string", $ne: "" }, description: { $exists: true } },
        { page, limit, sort: { createdAt: -1, _id: -1 } }
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
      return sendApiError(res, error);
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
        const createdEvent = {
          ...event,
          joined: [],
          createdBy: session.user.id,
          createdAt: new Date(),
          status: "approved",
        };
        const inserted = await db.collection(COLLECTION).insertOne(createdEvent);
        await invalidateCache.events();
        return res.status(201).json({ message: "Event added successfully", event: { ...createdEvent, _id: inserted.insertedId } });
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
      return sendApiError(res, error);
    }
  }

  if (req.method === "DELETE") {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) return res.status(401).json({ error: "Not authenticated" });

      const { id, eventId } = req.body;
      const deleteId = id || eventId;
      if (typeof deleteId !== "string" || !ObjectId.isValid(deleteId)) {
        return res.status(400).json({ error: "Missing event ID" });
      }

      const client = await clientPromise;
      const db = client.db();
      const event = await db.collection(COLLECTION).findOne({ _id: new ObjectId(deleteId) });
      if (!event) return res.status(404).json({ error: "Event not found" });
      if (session.user.role !== "admin" && String(event.createdBy) !== session.user.id) return res.status(403).json({ error: "Permission denied" });
      const result = await db.collection(COLLECTION).deleteOne({ _id: event._id });
      await db.collection("rsvps").deleteMany({ eventId: deleteId });

      if (result.deletedCount > 0) {
        await invalidateCache.events?.();
        return res.status(200).json({ success: true, message: "Event deleted" });
      } else {
        return res.status(404).json({ success: false, error: "Event not found" });
      }
    } catch (error) {
      console.error("Event DELETE error:", error);
      return sendApiError(res, error);
    }
  }

  if (req.method === "PUT") {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session?.user?.id) return res.status(401).json({ error: "Not authenticated" });
      const { eventId } = req.body;
      const userId = session.user.id;
      if (typeof eventId !== "string" || !ObjectId.isValid(eventId))
        return res.status(400).json({ error: "Invalid event ID" });

      const client = await clientPromise;
      const db = client.db();
      const result = await setEventAttendance(client, db, eventId, session.user, "going");
      await invalidateCache.events();
      return res.status(200).json(result);
    } catch (error) {
      if (!error.status) console.error("Event PUT error:", error.message);
      return sendApiError(res, error);
    }
  }

  return res.status(405).end();
}
