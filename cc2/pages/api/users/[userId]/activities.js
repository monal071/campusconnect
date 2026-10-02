import { resourceVisibility } from "../../../../lib/resource-access";
import { ObjectId } from "mongodb";
import { getPaginationParams } from "../../../../lib/pagination";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { connectToDatabase, getQuizDb } from "../../../../utils/mongodb";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId } = req.query;

  if (req.method === "GET") {
    try {
      const { client, db } = await connectToDatabase();

      const { limit, page, skip } = getPaginationParams(req);

      // Only allow users to see their own activities or if they're viewing another user's public profile
      // Users are stored by email, not ObjectId — use string-based lookup
      const lookup = typeof userId === "string" ? userId : session.user.id;
      const targetUser = await db.collection("users").findOne(ObjectId.isValid(lookup) ? { _id: new ObjectId(lookup) } : { email: lookup.toLowerCase() });
      if (!targetUser) return res.status(404).json({ error: "User not found" });
      const identities = [targetUser.email, String(targetUser._id), targetUser._id];

      // Fetch activities from various collections
      const recorded = await db.collection("userActivity").find({ userId: { $in: identities } }).sort({ timestamp: -1 }).limit(skip + limit).toArray();
      const activities = recorded.map(item => ({ _id: item._id, type: item.type === "event_join" ? "event" : item.type === "connection_accepted" ? "connection" : item.type, description: item.content, timestamp: item.timestamp, link: item.eventId ? "/events" : "/connections" }));

      // Posts — try both email-based and string userId fields
      const posts = await db
        .collection("posts")
        .find({
          $or: [
            { userEmail: { $in: identities } },
            { "author.email": { $in: identities } },
            { "author.id": { $in: identities } },
            { createdBy: { $in: identities } },
            { userId: { $in: identities } },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(skip + limit)
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
        .find({ $and: [resourceVisibility(session?.user)],
          $or: [
            { userEmail: { $in: identities } },
            { "author.email": { $in: identities } },
            { "author.id": { $in: identities } },
            { createdBy: { $in: identities } },
            { userId: { $in: identities } },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(skip + limit)
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
            { userEmail: { $in: identities } },
            { "author.email": { $in: identities } },
            { "author.id": { $in: identities } },
            { createdBy: { $in: identities } },
            { userId: { $in: identities } },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(skip + limit)
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
      const quizzes = await getQuizDb(client)
        .collection("quizzes")
        .find({
          $or: [
            { userEmail: { $in: identities } },
            { createdBy: { $in: identities } },
            { userId: { $in: identities } },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(skip + limit)
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
            { userEmail: { $in: identities } },
            { connectedUserEmail: { $in: identities } },
            { userId: { $in: identities } },
            { connectedUserId: { $in: identities } },
          ],
          status: "accepted",
        })
        .sort({ acceptedAt: -1 })
        .limit(skip + limit)
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
      const bookmarks = String(targetUser._id) !== session.user.id ? [] : await db
        .collection("bookmarks")
        .find({
          $or: [
            { userId: { $in: identities } },
            { userEmail: { $in: identities } },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(skip + limit)
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
            { follower: { $in: identities } },
            { followerId: { $in: identities } },
          ],
        })
        .sort({ createdAt: -1 })
        .limit(skip + limit)
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
