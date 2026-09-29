import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user) return res.status(401).json({ error: "Not authenticated" });
    const client = await clientPromise;
    const db = client.db();
    const userId = session.user.id;
    const rsvps = await db.collection("rsvps").find({ userId, status: "going" }, { projection: { eventId: 1 } }).toArray();
    const ids = rsvps.map((rsvp) => rsvp.eventId).filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));
    const data = await db.collection("events").aggregate([
      { $match: { status: "approved", $or: [{ joined: userId }, { _id: { $in: ids } }] } },
      { $addFields: { eventDate: { $convert: { input: "$date", to: "date", onError: null, onNull: null } } } },
      { $match: { eventDate: { $gte: new Date() } } },
      { $sort: { eventDate: 1 } },
      { $limit: 3 },
      { $project: { title: 1, date: 1, location: 1, description: 1 } },
    ]).toArray();
    return res.status(200).json({ data });
  } catch (error) {
    console.error("Upcoming events failed:", error.message);
    return res.status(500).json({ error: "Could not load upcoming events" });
  }
}
