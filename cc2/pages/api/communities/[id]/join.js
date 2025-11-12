import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import clientPromise from "../../../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.query;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid community ID" });
    }

    const client = await clientPromise;
    const db = client.db();

    // Get user
    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get community
    const community = await db
      .collection("communities")
      .findOne({ _id: new ObjectId(id) });

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if already a member
    if (community.members?.includes(user._id.toString())) {
      return res
        .status(400)
        .json({ message: "Already a member of this community" });
    }

    // Check if already requested
    if (community.pendingRequests?.includes(user._id.toString())) {
      return res.status(400).json({ message: "Join request already pending" });
    }

    if (community.isPrivate) {
      // For private communities, add to pending requests
      await db.collection("communities").updateOne(
        { _id: new ObjectId(id) },
        {
          $push: { pendingRequests: user._id.toString() },
          $set: { updatedAt: new Date() },
        }
      );

      // Add to user's pending requests
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $push: { pendingCommunityRequests: id },
          $set: { updatedAt: new Date() },
        }
      );

      // Create notification for community creator
      await db.collection("notifications").insertOne({
        userId: community.creatorId,
        type: "community_join_request",
        message: `${user.name} wants to join ${community.name}`,
        communityId: id,
        requesterId: user._id.toString(),
        requester: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
        },
        read: false,
        createdAt: new Date(),
      });

      return res.status(200).json({
        success: true,
        message: "Join request sent",
        joinStatus: "pending",
      });
    } else {
      // For public communities, add directly as member
      await db.collection("communities").updateOne(
        { _id: new ObjectId(id) },
        {
          $push: { members: user._id.toString() },
          $set: { updatedAt: new Date() },
        }
      );

      // Add to user's communities
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $push: { communities: id },
          $set: { updatedAt: new Date() },
        }
      );

      return res.status(200).json({
        success: true,
        message: "Joined community",
        joinStatus: "member",
      });
    }
  } catch (error) {
    console.error("Error joining community:", error);
    return res.status(500).json({ message: "Failed to join community" });
  }
}
