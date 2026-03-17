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

    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ message: "Community code is required" });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = user._id.toString();

    // Find community by code
    const community = await db
      .collection("communities")
      .findOne({ code: code.trim().toLowerCase() });

    if (!community) {
      return res.status(404).json({ message: "Invalid community code" });
    }

    // Check if already a member
    if (community.members?.includes(userId)) {
      return res
        .status(400)
        .json({ message: "You are already a member of this community" });
    }

    // Add user to community members
    await db.collection("communities").updateOne(
      { _id: community._id },
      {
        $push: { members: userId },
        $set: { updatedAt: new Date() },
      },
    );

    // Add community to user's communities list
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $push: { communities: community._id.toString() },
        $set: { updatedAt: new Date() },
      },
    );

    // Invalidate cache
    await cache.del(`communities:user:${userId}`);

    return res.status(200).json({
      success: true,
      message: "Successfully joined community!",
      community: {
        _id: community._id.toString(),
        name: community.name,
        description: community.description,
        memberCount: (community.members?.length || 0) + 1,
      },
    });
  } catch (error) {
    console.error("Error joining community:", error);
    return res.status(500).json({ message: "Failed to join community" });
  }
}
