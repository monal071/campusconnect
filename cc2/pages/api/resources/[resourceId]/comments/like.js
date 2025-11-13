import { connectToDatabase } from "../../../../../utils/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]";

export default async function handler(req, res) {
  const { resourceId } = req.query;

  if (!resourceId) {
    return res.status(400).json({ error: "Resource ID is required" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { db } = await connectToDatabase();
    const { commentId } = req.body;

    if (!commentId) {
      return res.status(400).json({ error: "Comment ID is required" });
    }

    // Check if already liked
    const existingLike = await db.collection("commentLikes").findOne({
      commentId,
      userId: session.user.id,
    });

    if (existingLike) {
      // Unlike
      await db.collection("commentLikes").deleteOne({
        commentId,
        userId: session.user.id,
      });

      await db
        .collection("resourceComments")
        .updateOne({ _id: commentId }, { $inc: { likes: -1 } });

      const comment = await db
        .collection("resourceComments")
        .findOne({ _id: commentId });

      return res.status(200).json({
        success: true,
        isLiked: false,
        likes: comment.likes,
      });
    } else {
      // Like
      await db.collection("commentLikes").insertOne({
        commentId,
        userId: session.user.id,
        createdAt: new Date(),
      });

      await db
        .collection("resourceComments")
        .updateOne({ _id: commentId }, { $inc: { likes: 1 } });

      const comment = await db
        .collection("resourceComments")
        .findOne({ _id: commentId });

      // Create notification for comment author
      if (comment.userId !== session.user.id) {
        await db.collection("notifications").insertOne({
          userId: comment.userId,
          type: "comment_like",
          message: `${session.user.name} liked your comment`,
          resourceId,
          commentId,
          fromUser: session.user.id,
          read: false,
          createdAt: new Date(),
        });
      }

      return res.status(200).json({
        success: true,
        isLiked: true,
        likes: comment.likes,
      });
    }
  } catch (error) {
    console.error("Like API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
