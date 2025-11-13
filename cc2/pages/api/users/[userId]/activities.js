import { getSession } from "next-auth/react";
import { connectToDatabase } from "../../../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId } = req.query;

  if (req.method === "GET") {
    try {
      const { db } = await connectToDatabase();

      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const skip = (page - 1) * limit;

      // Only allow users to see their own activities or if they're viewing another user's public profile
      const targetUserId = userId || session.user.id;

      // Fetch activities from various collections
      const activities = [];

      // Posts
      const posts = await db
        .collection("posts")
        .find({ userId: new ObjectId(targetUserId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      posts.forEach((post) => {
        activities.push({
          _id: post._id,
          type: "post",
          description: "Created a new post",
          details:
            post.content?.substring(0, 100) +
            (post.content?.length > 100 ? "..." : ""),
          timestamp: post.createdAt,
          link: `/posts/${post._id}`,
        });
      });

      // Resources
      const resources = await db
        .collection("resources")
        .find({ userId: new ObjectId(targetUserId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      resources.forEach((resource) => {
        activities.push({
          _id: resource._id,
          type: "resource",
          description: "Shared a new resource",
          details: resource.title,
          timestamp: resource.createdAt,
          link: `/resources/${resource._id}`,
        });
      });

      // Events
      const events = await db
        .collection("events")
        .find({ userId: new ObjectId(targetUserId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      events.forEach((event) => {
        activities.push({
          _id: event._id,
          type: "event",
          description: "Created an event",
          details: event.title,
          timestamp: event.createdAt,
          link: `/events/${event._id}`,
        });
      });

      // Quizzes
      const quizzes = await db
        .collection("quizzes")
        .find({ userId: new ObjectId(targetUserId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      quizzes.forEach((quiz) => {
        activities.push({
          _id: quiz._id,
          type: "quiz",
          description: "Created a quiz",
          details: quiz.title,
          timestamp: quiz.createdAt,
          link: `/quiz/${quiz._id}`,
        });
      });

      // Connections
      const connections = await db
        .collection("connections")
        .find({
          $or: [
            { userId: new ObjectId(targetUserId) },
            { connectedUserId: new ObjectId(targetUserId) },
          ],
          status: "accepted",
        })
        .sort({ acceptedAt: -1 })
        .limit(limit)
        .toArray();

      for (const connection of connections) {
        const otherUserId =
          connection.userId.toString() === targetUserId
            ? connection.connectedUserId
            : connection.userId;

        const otherUser = await db
          .collection("users")
          .findOne({ _id: new ObjectId(otherUserId) });

        activities.push({
          _id: connection._id,
          type: "connection",
          description: `Connected with ${otherUser?.name || "someone"}`,
          timestamp: connection.acceptedAt || connection.createdAt,
          link: `/connections/${otherUserId}`,
        });
      }

      // Bookmarks
      const bookmarks = await db
        .collection("bookmarks")
        .find({ userId: new ObjectId(targetUserId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      bookmarks.forEach((bookmark) => {
        activities.push({
          _id: bookmark._id,
          type: "bookmark",
          description: `Saved a ${bookmark.itemType}`,
          details: bookmark.itemTitle,
          timestamp: bookmark.createdAt,
          link:
            bookmark.itemType === "post"
              ? `/posts/${bookmark.itemId}`
              : `/${bookmark.itemType}s/${bookmark.itemId}`,
        });
      });

      // Follows
      const follows = await db
        .collection("follows")
        .find({ followerId: new ObjectId(targetUserId) })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      for (const follow of follows) {
        const followedUser = await db
          .collection("users")
          .findOne({ _id: new ObjectId(follow.followingId) });

        activities.push({
          _id: follow._id,
          type: "follow",
          description: `Started following ${followedUser?.name || "someone"}`,
          timestamp: follow.createdAt,
          link: `/connections/${follow.followingId}`,
        });
      }

      // Sort all activities by timestamp
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Paginate
      const paginatedActivities = activities.slice(skip, skip + limit);
      const hasMore = activities.length > skip + limit;

      res.status(200).json({
        activities: paginatedActivities,
        hasMore,
        total: activities.length,
      });
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
