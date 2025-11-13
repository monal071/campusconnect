import { connectToDatabase } from "../../../utils/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  const { eventId } = req.query;

  if (!eventId) {
    return res.status(400).json({ error: "Event ID is required" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { db } = await connectToDatabase();

    if (req.method === "GET") {
      // Get user's RSVP status and attendee counts
      const userRSVP = await db.collection("rsvps").findOne({
        eventId,
        userId: session.user.id,
      });

      // Get counts for each status
      const counts = await db
        .collection("rsvps")
        .aggregate([
          { $match: { eventId } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const countsObj = {
        going: 0,
        maybe: 0,
        not_going: 0,
      };

      counts.forEach((item) => {
        countsObj[item._id] = item.count;
      });

      return res.status(200).json({
        userStatus: userRSVP?.status || null,
        reminder: userRSVP?.reminder || false,
        counts: countsObj,
      });
    }

    if (req.method === "POST") {
      // Update or create RSVP
      const { status } = req.body;

      if (!["going", "maybe", "not_going"].includes(status)) {
        return res.status(400).json({ error: "Invalid RSVP status" });
      }

      const result = await db.collection("rsvps").updateOne(
        {
          eventId,
          userId: session.user.id,
        },
        {
          $set: {
            status,
            respondedAt: new Date(),
          },
          $setOnInsert: {
            eventId,
            userId: session.user.id,
            createdAt: new Date(),
            reminder: false,
          },
        },
        { upsert: true }
      );

      // Get updated counts
      const counts = await db
        .collection("rsvps")
        .aggregate([
          { $match: { eventId } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const countsObj = {
        going: 0,
        maybe: 0,
        not_going: 0,
      };

      counts.forEach((item) => {
        countsObj[item._id] = item.count;
      });

      // Update event attendee count
      if (status === "going") {
        await db
          .collection("events")
          .updateOne(
            { _id: eventId },
            { $set: { attendees: countsObj.going } }
          );
      }

      // Create notification for event creator
      const event = await db.collection("events").findOne({ _id: eventId });
      if (event && event.createdBy !== session.user.id && status === "going") {
        await db.collection("notifications").insertOne({
          userId: event.createdBy,
          type: "event_rsvp",
          message: `${session.user.name} is attending your event "${event.title}"`,
          eventId,
          fromUser: session.user.id,
          read: false,
          createdAt: new Date(),
        });
      }

      return res.status(200).json({
        success: true,
        status,
        counts: countsObj,
      });
    }

    if (req.method === "DELETE") {
      // Remove RSVP
      await db.collection("rsvps").deleteOne({
        eventId,
        userId: session.user.id,
      });

      // Get updated counts
      const counts = await db
        .collection("rsvps")
        .aggregate([
          { $match: { eventId } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      const countsObj = {
        going: 0,
        maybe: 0,
        not_going: 0,
      };

      counts.forEach((item) => {
        countsObj[item._id] = item.count;
      });

      // Update event attendee count
      await db
        .collection("events")
        .updateOne({ _id: eventId }, { $set: { attendees: countsObj.going } });

      return res.status(200).json({
        success: true,
        counts: countsObj,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("RSVP API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
