import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import clientPromise from "../../../../utils/mongodb";
import { ObjectId } from "mongodb";
import { cache } from "../../../../lib/redis";

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
    const { memberId, action } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid community ID" });
    }

    if (!memberId || !action) {
      return res
        .status(400)
        .json({ message: "memberId and action are required" });
    }

    const validActions = ["remove", "make-admin", "remove-admin"];
    if (!validActions.includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const client = await clientPromise;
    const db = client.db();

    const user = await db
      .collection("users")
      .findOne({ email: session.user.email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const community = await db
      .collection("communities")
      .findOne({ _id: new ObjectId(id) });

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const userId = user._id.toString();
    const isAdmin =
      community.admins?.includes(userId) || community.creatorId === userId;

    if (!isAdmin) {
      return res
        .status(403)
        .json({ message: "Only community admins can manage members" });
    }

    // Cannot remove creator
    if (action === "remove" && community.creatorId === memberId) {
      return res
        .status(400)
        .json({ message: "Cannot remove community creator" });
    }

    // Cannot change creator's admin status
    if (
      (action === "remove-admin" || action === "make-admin") &&
      community.creatorId === memberId
    ) {
      return res
        .status(400)
        .json({ message: "Cannot change creator's admin status" });
    }

    if (action === "remove") {
      // Remove member from community
      await db.collection("communities").updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { members: memberId, admins: memberId },
          $set: { updatedAt: new Date() },
        },
      );

      // Remove community from user's list
      await db
        .collection("users")
        .updateOne(
          { _id: new ObjectId(memberId) },
          { $pull: { communities: id } },
        );
    } else if (action === "make-admin") {
      // Make user admin (if not already)
      if (!community.admins?.includes(memberId)) {
        await db.collection("communities").updateOne(
          { _id: new ObjectId(id) },
          {
            $push: { admins: memberId },
            $set: { updatedAt: new Date() },
          },
        );
      }
    } else if (action === "remove-admin") {
      // Remove admin status (keep as member)
      await db.collection("communities").updateOne(
        { _id: new ObjectId(id) },
        {
          $pull: { admins: memberId },
          $set: { updatedAt: new Date() },
        },
      );
    }

    // Invalidate caches
    await cache.delPattern("communities:user:*");

    return res.status(200).json({
      success: true,
      message: `Member ${action.replace("-", " ")} successfully`,
    });
  } catch (error) {
    console.error("Error managing member:", error);
    return res.status(500).json({ message: "Failed to manage member" });
  }
}
