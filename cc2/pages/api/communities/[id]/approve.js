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
    const { requesterId } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid community ID" });
    }

    if (!requesterId) {
      return res.status(400).json({ message: "Requester ID is required" });
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

    // Check if user is the creator
    if (community.creatorId !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only community creator can approve requests" });
    }

    // Check if requester is in pending requests
    if (!community.pendingRequests?.includes(requesterId)) {
      return res.status(400).json({ message: "No pending request found" });
    }

    // Get requester
    const requester = await db
      .collection("users")
      .findOne({ _id: new ObjectId(requesterId) });

    if (!requester) {
      return res.status(404).json({ message: "Requester not found" });
    }

    // Add to members and remove from pending
    await db.collection("communities").updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { members: requesterId },
        $pull: { pendingRequests: requesterId },
        $set: { updatedAt: new Date() },
      }
    );

    // Update requester's communities
    await db.collection("users").updateOne(
      { _id: new ObjectId(requesterId) },
      {
        $push: { communities: id },
        $pull: { pendingCommunityRequests: id },
        $set: { updatedAt: new Date() },
      }
    );

    // Create notification for requester
    await db.collection("notifications").insertOne({
      userId: requesterId,
      type: "community_join_approved",
      message: `Your request to join ${community.name} was approved`,
      communityId: id,
      read: false,
      createdAt: new Date(),
    });

    // Delete the join request notification for creator
    await db.collection("notifications").deleteOne({
      userId: community.creatorId,
      type: "community_join_request",
      communityId: id,
      requesterId: requesterId,
    });

    return res.status(200).json({
      success: true,
      message: "Request approved",
    });
  } catch (error) {
    console.error("Error approving request:", error);
    return res.status(500).json({ message: "Failed to approve request" });
  }
}
