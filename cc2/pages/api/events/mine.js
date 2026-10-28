import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const client = await clientPromise;
    const db = client.db();
    const [approvedEvents, submittedEvents] = await Promise.all([
      db.collection("events")
        .find({ createdBy: session.user.id })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
      db.collection("pending_events")
        .find({ createdBy: session.user.id })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray(),
    ]);

    const events = [...approvedEvents, ...submittedEvents]
      .map((event) => ({
        ...event,
        _id: String(event._id),
        createdBy: String(event.createdBy),
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ events });
  } catch (error) {
    console.error("My events GET error:", error);
    return res.status(500).json({ error: "Failed to load your event submissions" });
  }
}
