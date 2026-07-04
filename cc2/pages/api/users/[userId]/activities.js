import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { connectToDatabase } from "../../../../utils/mongodb";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
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
      // Users are stored by email, not ObjectId — use string-based lookup
      const targetUserEmail = userId || session.user.email;

      // Fetch activities from various collections
      const activities = [];

      // Posts — try both email-based and string userId fields
      const posts = await db
        .collection("posts")
        .find({
          $or: [
            { userEmail: targetUserEmail },
            { "author.email": targetUserEmail },
            { userId: targetUserEmail },
          ],
        })
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
        .find({
          $or: [
            { userEmail: targetUserEmail },
            { "author.email": targetUserEmail },
            { userId: targetUserEmail },
          ],
        })
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
        .find({
          $or: [
            { userEmail: targetUserEmail },
            { "author.email": targetUserEmail },
            { userId: targetUserEmail },
          ],
        })
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
        .find({
          $or: [
            { userEmail: targetUserEmail },
            { createdBy: targetUserEmail },
            { userId: targetUserEmail },
          ],
        })
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
            { userEmail: targetUserEmail },
            { connectedUserEmail: targetUserEmail },
            { userId: targetUserEmail },
            { connectedUserId: targetUserEmail },
          ],
          status: "accepted",
        })
        .sort({ acceptedAt: -1 })
        .limit(limit)
        .toArray();

      for (const connection of connections) {
        const otherUserEmail =
          (connection.userEmail || connection.userId) === targetUserEmail
            ? connection.connectedUserEmail || connection.connectedUserId
            : connection.userEmail || connection.userId;

        const otherUser = await db
          .collection("users")
          .findOne({ email: otherUserEmail });

        activities.push({
          _id: connection._id,
          type: "connection",
          description: `Connected with ${otherUser?.name || "someone"}`,
          timestamp: connection.acceptedAt || connection.createdAt,
          link: `/connections/${otherUserEmail}`,
        });
      }

      // Bookmarks
      const bookmarks = await db
        .collection("bookmarks")
        .find({
          $or: [
            { userId: targetUserEmail },
            { userEmail: targetUserEmail },
          ],
        })
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
        .find({
          $or: [
            { follower: targetUserEmail },
            { followerId: targetUserEmail },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      for (const follow of follows) {
        const followingId = follow.following || follow.followingId;
        const followedUser = await db
          .collection("users")
          .findOne({ email: followingId });

        activities.push({
          _id: follow._id,
          type: "follow",
          description: `Started following ${followedUser?.name || "someone"}`,
          timestamp: follow.createdAt,
          link: `/connections/${followingId}`,
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
