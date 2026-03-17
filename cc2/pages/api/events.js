import {
  addItem,
  getAllItems,
  updateItem,
  getItem,
  deleteItem,
} from "../../utils/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import clientPromise from "../../utils/mongodb";
import { cache, cacheKeys, cacheTTL } from "../../lib/redis";
import { getPaginationParams, paginatedQuery } from "../../lib/pagination";

const TABLE_NAME = "events";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { page, limit } = getPaginationParams(req);

      // Try to get from cache
      const cacheKey = cacheKeys.events(page, limit);
      const cached = await cache.get(cacheKey);

      if (cached) {
        return res.status(200).json(cached);
      }

      const client = await clientPromise;
      const db = client.db();

      const queryResult = await paginatedQuery(
        db.collection(TABLE_NAME),
        { status: "approved" },
        { page, limit, sort: { createdAt: -1 } },
      );

      // Filter out malformed events
      const validEvents = (queryResult.data || []).filter(
        (event) =>
          event &&
          typeof event === "object" &&
          event.title &&
          event.description !== undefined,
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

      // Cache the response
      await cache.set(cacheKey, response, cacheTTL.events);

      res.status(200).json(response);
    } catch (error) {
      console.error("Events API error:", error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "POST") {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const event = req.body;
      const client = await clientPromise;
      const db = client.db();

      if (session.user.role === "admin") {
        // Admins can directly add events
        await addItem(TABLE_NAME, {
          ...event,
          joined: [],
          createdBy: session.user.id,
          createdAt: new Date().toISOString(),
          status: "approved",
        });
        res.status(201).json({ message: "Event added successfully" });
      } else {
        // Regular users submit for approval
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

        // Notify all admins about new pending event
        const admins = await db
          .collection("users")
          .find({ role: "admin" })
          .toArray();
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

        res.status(201).json({
          message:
            "Event submitted for approval. You will be notified once reviewed.",
          isPending: true,
        });
      }
    } catch (error) {
      console.error("Event submission error:", error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "DELETE") {
    try {
      const { id, eventId } = req.body;
      const deleteId = id || eventId;
      if (!deleteId) {
        return res.status(400).json({ error: "Missing event ID" });
      }

      const result = await deleteItem(TABLE_NAME, deleteId);

      if (result && result.success) {
        res.status(200).json({ success: true, message: "Event deleted" });
      } else {
        res.status(404).json({ success: false, error: "Event not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === "PUT") {
    // Join event: expects { eventId, userId }
    try {
      const { eventId, userId } = req.body;
      if (!eventId || !userId)
        return res.status(400).json({ error: "Missing eventId or userId" });
      // Get event
      const eventRes = await getItem(TABLE_NAME, eventId);
      if (!eventRes.success || !eventRes.data)
        return res.status(404).json({ error: "Event not found" });
      const joined = Array.isArray(eventRes.data.joined)
        ? eventRes.data.joined
        : [];
      if (!joined.includes(userId)) {
        joined.push(userId);
        await updateItem(TABLE_NAME, eventId, { joined });
      }
      res.status(200).json({ success: true, joinedCount: joined.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).end();
  }
}
