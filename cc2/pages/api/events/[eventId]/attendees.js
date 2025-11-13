import { connectToDatabase } from "../../../utils/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  const { eventId } = req.query;
  const { status = "going" } = req.query;

  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();

    // Get attendees with the specified status
    const rsvps = await db
      .collection("rsvps")
      .find({
        eventId,
        status,
      })
      .sort({ respondedAt: -1 })
      .toArray();

    // Get user details for each RSVP
    const userIds = rsvps.map((rsvp) => rsvp.userId);
    const users = await db
      .collection("users")
      .find({ _id: { $in: userIds } })
      .project({ name: 1, email: 1, image: 1 })
      .toArray();

    // Create a map for quick lookup
    const userMap = {};
    users.forEach((user) => {
      userMap[user._id] = user;
    });

    // Combine RSVP data with user data
    const attendees = rsvps.map((rsvp) => ({
      _id: rsvp.userId,
      name: userMap[rsvp.userId]?.name || "Unknown",
      email: userMap[rsvp.userId]?.email,
      image: userMap[rsvp.userId]?.image,
      respondedAt: rsvp.respondedAt,
      status: rsvp.status,
    }));

    return res.status(200).json({
      attendees,
      count: attendees.length,
    });
  } catch (error) {
    console.error("Attendees API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
