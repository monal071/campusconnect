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

    // If there's no activity data available, return dummy data
    if (!activity || activity.length === 0) {
      activity = [
        {
          _id: "1",
          userId,
          type: "connection",
          content: "Sarah Johnson accepted your connection request",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          icon: "PeopleIcon"
        },
        {
          _id: "2",
          userId,
          type: "post",
          content: "Your post about CS internships received 12 likes",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          icon: "ArticleIcon"
        },
        {
          _id: "3",
          userId,
          type: "event",
          content: "You were tagged in the Tech Career Fair event",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          icon: "EventIcon"
        },
        {
          _id: "4",
          userId,
          type: "resource",
          content: "Your shared resource on Web Development was saved by 5 users",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
          icon: "MenuBookIcon"
        },
        {
          _id: "5",
          userId,
          type: "job",
          content: "A new job matching your interests was posted: Software Developer Intern",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
          icon: "WorkIcon"
        }
      ];
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
