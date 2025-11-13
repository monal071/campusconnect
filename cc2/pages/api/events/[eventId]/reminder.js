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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const { enabled } = req.body;

    // Update reminder setting
    await db.collection("rsvps").updateOne(
      {
        eventId,
        userId: session.user.id,
      },
      {
        $set: {
          reminder: enabled,
          reminderUpdatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      reminder: enabled,
    });
  } catch (error) {
    console.error("Reminder API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
