import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import clientPromise from "../../../../utils/mongodb";
import { ObjectId } from "mongodb";
import { cache } from "../../../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user?.email) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.query;
    const { name, description, image } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid community ID" });
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
        .json({ message: "Only community admins can update community" });
    }

    const updates = {};
    if (name && name.trim()) {
      updates.name = name.trim();
    }
    if (description !== undefined) {
      updates.description = description?.trim() || "";
    }
    if (image !== undefined) {
      updates.image = image || null;
    }
    updates.updatedAt = new Date();

    const result = await db
      .collection("communities")
      .updateOne({ _id: new ObjectId(id) }, { $set: updates });

    // Invalidate cache for all users in the community
    await cache.delPattern("communities:user:*");

    return res.status(200).json({
      success: true,
      message: "Community updated successfully",
      community: { ...community, ...updates, _id: id },
    });
  } catch (error) {
    console.error("Error updating community:", error);
    return res.status(500).json({ message: "Failed to update community" });
  }
}
