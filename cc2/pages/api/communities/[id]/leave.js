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

    const userId = user._id.toString();

    // Get community
    const community = await db
      .collection("communities")
      .findOne({ _id: new ObjectId(id) });

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if user is a member
    const isMember = community.members?.includes(userId);

    if (!isMember) {
      return res
        .status(400)
        .json({ message: "You are not a member of this community" });
    }

    // Creator cannot leave their own community
    if (community.creatorId === userId) {
      return res.status(400).json({
        message:
          "As the creator, you cannot leave the community. You can delete it instead.",
      });
    }

    // Remove user from members array
    await db.collection("communities").updateOne(
      { _id: new ObjectId(id) },
      {
        $pull: {
          members: userId,
          admins: userId, // Also remove from admins if they were an admin
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "You have left the community successfully",
    });
  } catch (error) {
    console.error("Error leaving community:", error);
    return res.status(500).json({ message: "Failed to leave community" });
  }
}
