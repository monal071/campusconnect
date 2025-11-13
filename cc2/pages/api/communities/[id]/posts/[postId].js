import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import clientPromise from "../../../../../utils/mongodb";
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

    const { id, postId } = req.query;

    if (!id || !ObjectId.isValid(id) || !postId || !ObjectId.isValid(postId)) {
      return res.status(400).json({ message: "Invalid ID" });
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

    // Get post
    const post = await db
      .collection("communityPosts")
      .findOne({ _id: new ObjectId(postId) });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is community creator or post author
    const isCreator = community.creatorId === user._id.toString();
    const isAuthor = post.author.id === user._id.toString();

    if (!isCreator && !isAuthor) {
      return res
        .status(403)
        .json({
          message: "Only community creator or post author can delete posts",
        });
    }

    // Delete post
    await db
      .collection("communityPosts")
      .deleteOne({ _id: new ObjectId(postId) });

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    return res.status(500).json({ message: "Failed to delete post" });
  }
}
