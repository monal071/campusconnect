import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";
import events, { eventSchema } from "../events";
import { invalidateCache } from "../../../lib/redis";
export default async function handler(req, res) {
  const { eventId } = req.query;
  if (req.method === "DELETE") { req.body = { eventId }; return events(req, res); }
  if (!["GET", "PUT"].includes(req.method)) return res.status(405).json({ error: "Method not allowed" });
  if (typeof eventId !== "string" || !ObjectId.isValid(eventId)) return res.status(400).json({ error: "Invalid event ID" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) return res.status(401).json({ error: "Not authenticated" });
    const client = await clientPromise;
    const collection = client.db().collection("events");
    const event = await collection.findOne({ _id: new ObjectId(eventId), status: "approved" });
    if (!event) return res.status(404).json({ error: "Event not found" });
    if (req.method === "GET") return res.status(200).json(event);
    if (String(event.createdBy) !== session.user.id && session.user.role !== "admin") return res.status(403).json({ error: "Permission denied" });
    const parsed = eventSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0].message });
    const updated = await collection.findOneAndUpdate({ _id: event._id }, { $set: { ...parsed.data, updatedAt: new Date() } }, { returnDocument: "after" });
    await invalidateCache.events();
    return res.status(200).json(updated);
  } catch { return res.status(500).json({ error: "Failed to update event" }); }
}
