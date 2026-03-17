import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import clientPromise from "../../../utils/mongodb";
import { cache } from "../../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const commResult = await db.collection("communities").deleteMany({});
    const postsResult = await db.collection("communityPosts").deleteMany({});

    await db
      .collection("users")
      .updateMany(
        {},
        { $set: { communities: [], pendingCommunityRequests: [] } },
      );

    await db.collection("notifications").deleteMany({
      type: {
        $in: [
          "community_join_request",
          "community_join_approved",
          "community_join_declined",
        ],
      },
    });

    // Create unique index on code field for new system
    try {
      await db
        .collection("communities")
        .createIndex({ code: 1 }, { unique: true });
    } catch {
      // Index may already exist
    }

    await cache.delPattern("communities:*");

    return res.status(200).json({
      success: true,
      deleted: {
        communities: commResult.deletedCount,
        communityPosts: postsResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("Error clearing communities:", error);
    return res.status(500).json({ message: "Failed to clear communities" });
  }
}
