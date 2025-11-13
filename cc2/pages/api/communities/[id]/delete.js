import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import clientPromise from "../../../../utils/mongodb";
import { ObjectId } from "mongodb";

export default async function handler(req, res) {
  if (req.method !== "DELETE") {
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

    // Check if user is admin
    if (user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can delete communities" });
    }

    // Get community
    const community = await db
      .collection("communities")
      .findOne({ _id: new ObjectId(id) });

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Delete all posts in the community
    await db.collection("communityPosts").deleteMany({ communityId: id });

    // Delete all notifications related to this community
    await db.collection("notifications").deleteMany({ communityId: id });

    // Remove community from all users' community lists
    await db.collection("users").updateMany(
      {
        $or: [{ communities: id }, { pendingCommunityRequests: id }],
      },
      {
        $pull: {
          communities: id,
          pendingCommunityRequests: id,
        },
      }
    );

    // Delete the community
    await db.collection("communities").deleteOne({ _id: new ObjectId(id) });

    return res.status(200).json({
      success: true,
      message: "Community deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting community:", error);
    return res.status(500).json({ message: "Failed to delete community" });
  }
}
