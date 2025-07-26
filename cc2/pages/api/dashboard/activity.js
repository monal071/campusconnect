import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get the user's session
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const client = await clientPromise;
    const db = client.db();
    const userId = session.user.id;
    
    // Get the limit from query params or default to 5
    const limit = parseInt(req.query.limit) || 5;

    // Fetch user activity from the activity collection
    // This collection would store all activity like connections, posts, likes, etc.
    let activity = await db.collection("userActivity")
      .find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    // Return empty array if no activity data is available
    if (!activity || activity.length === 0) {
      activity = []; // Return an empty array instead of dummy data
    }

    // Format the activity data
    const formattedActivity = activity.map(item => ({
      id: item._id.toString(),
      type: item.type,
      content: item.content,
      timestamp: item.timestamp,
      icon: item.icon
    }));

    // Return the activity data
    return res.status(200).json({
      message: "Activity retrieved successfully",
      data: formattedActivity
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return res.status(500).json({ message: "Failed to fetch activity" });
  }
}
