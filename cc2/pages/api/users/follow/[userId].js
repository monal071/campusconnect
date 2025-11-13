import { getSession } from "next-auth/react";
import clientPromise from "../../../utils/mongodb";

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const client = await clientPromise;
  const db = client.db();

  if (req.method === "POST") {
    // Follow user
    try {
      const followsCollection = db.collection("follows");

      // Check if already following
      const existing = await followsCollection.findOne({
        follower: session.user.email,
        following: userId,
      });

      if (existing) {
        return res.status(400).json({ error: "Already following this user" });
      }

      // Add follow relationship
      await followsCollection.insertOne({
        follower: session.user.email,
        following: userId,
        createdAt: new Date(),
      });

      // Update user stats
      await db.collection("users").updateOne(
        { email: session.user.email },
        { $inc: { followingCount: 1 } }
      );

      await db.collection("users").updateOne(
        { email: userId },
        { $inc: { followersCount: 1 } }
      );

      return res.status(200).json({ message: "Successfully followed user" });
    } catch (error) {
      console.error("Follow error:", error);
      return res.status(500).json({ error: "Failed to follow user" });
    }
  }

  if (req.method === "DELETE") {
    // Unfollow user
    try {
      const followsCollection = db.collection("follows");

      const result = await followsCollection.deleteOne({
        follower: session.user.email,
        following: userId,
      });

      if (result.deletedCount === 0) {
        return res.status(400).json({ error: "Not following this user" });
      }

      // Update user stats
      await db.collection("users").updateOne(
        { email: session.user.email },
        { $inc: { followingCount: -1 } }
      );

      await db.collection("users").updateOne(
        { email: userId },
        { $inc: { followersCount: -1 } }
      );

      return res.status(200).json({ message: "Successfully unfollowed user" });
    } catch (error) {
      console.error("Unfollow error:", error);
      return res.status(500).json({ error: "Failed to unfollow user" });
    }
  }

  if (req.method === "GET") {
    // Check if following user
    try {
      const followsCollection = db.collection("follows");

      const isFollowing = await followsCollection.findOne({
        follower: session.user.email,
        following: userId,
      });

      return res.status(200).json({ isFollowing: !!isFollowing });
    } catch (error) {
      console.error("Check following error:", error);
      return res.status(500).json({ error: "Failed to check following status" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
