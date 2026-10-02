import { withResourceAccess } from "../../../../lib/resource-access";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "../../../../utils/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]";

async function handler(req, res) {
  const { resourceId } = req.query;

  if (typeof resourceId !== "string" || !ObjectId.isValid(resourceId)) {
    return res.status(400).json({ error: "Resource ID is required" });
  }

  const session = await getServerSession(req, res, authOptions);

  try {
    const { db } = await connectToDatabase();
    const existingResource = await db.collection("resources").findOne({ _id: new ObjectId(resourceId) });
    if (!existingResource) return res.status(404).json({ error: "Resource not found" });

    if (req.method === "GET") {
      // Get all comments for a resource
      const { sortBy = "recent" } = req.query;

      const sortOption =
        sortBy === "popular" ? { likes: -1, createdAt: -1 } : { createdAt: -1 };

      const comments = await db
        .collection("resourceComments")
        .find({ resourceId, parentId: null })
        .sort(sortOption)
        .toArray();

      // Get author details and replies for each comment
      const commentsWithDetails = await Promise.all(
        comments.map(async (comment) => {
          const author = await db
            .collection("users")
            .findOne({ _id: ObjectId.isValid(comment.userId) ? new ObjectId(comment.userId) : null }, { projection: { name: 1, email: 1, image: 1 } });

          // Get replies
          const replies = await db
            .collection("resourceComments")
            .find({ parentId: { $in: [comment._id, String(comment._id)] }, resourceId })
            .sort({ createdAt: 1 })
            .toArray();

          const repliesWithAuthors = await Promise.all(
            replies.map(async (reply) => {
              const replyAuthor = await db
                .collection("users")
                .findOne({ _id: ObjectId.isValid(reply.userId) ? new ObjectId(reply.userId) : null }, { projection: { name: 1, email: 1, image: 1 } });

              // Check if current user liked this reply
              const isLiked = session?.user
                ? (await db.collection("commentLikes").findOne({
                    commentId: { $in: [reply._id, String(reply._id)] },
                    userId: session.user.id,
                  })) !== null
                : false;

              return {
                ...reply,
                author: replyAuthor,
                isLiked,
              };
            })
          );

          // Check if current user liked this comment
          const isLiked = session?.user
            ? (await db.collection("commentLikes").findOne({
                commentId: { $in: [comment._id, String(comment._id)] },
                userId: session.user.id,
              })) !== null
            : false;

          return {
            ...comment,
            author,
            replies: repliesWithAuthors,
            isLiked,
          };
        })
      );

      return res.status(200).json({
        comments: commentsWithDetails,
        count: commentsWithDetails.length,
      });
    }

    if (req.method === "POST") {
      // Create new comment
      if (!session?.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { content, parentId = null } = req.body;

      if (typeof content !== "string" || !content.trim() || content.length > 5000) {
        return res.status(400).json({ error: "Comment content is required" });
      }

      if (parentId && (typeof parentId !== "string" || !ObjectId.isValid(parentId) || !await db.collection("resourceComments").findOne({ _id: new ObjectId(parentId), resourceId, parentId: null }))) return res.status(400).json({ error: "Invalid parent comment" });
      const newComment = {
        resourceId,
        userId: session.user.id,
        content: content.trim(),
        parentId: parentId ? new ObjectId(parentId) : null,
        likes: 0,
        edited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db
        .collection("resourceComments")
        .insertOne(newComment);

      // Get author details
      const author = await db
        .collection("users")
        .findOne({ _id: ObjectId.isValid(session.user.id) ? new ObjectId(session.user.id) : null }, { projection: { name: 1, email: 1, image: 1 } });

      // Create notification for resource owner (if not self-comment)
      const resource = await db
        .collection("resources")
        .findOne({ _id: new ObjectId(resourceId) });
      if (resource && String(resource.userId ?? resource.createdBy) !== session.user.id) {
        await db.collection("notifications").insertOne({
          userId: String(resource.userId ?? resource.createdBy),
          type: "resource_comment",
          message: `${session.user.name} commented on your resource`,
          resourceId,
          commentId: result.insertedId,
          fromUser: session.user.id,
          read: false,
          createdAt: new Date(),
        });
      }

      // If reply, notify parent comment author
      if (parentId) {
        const parentComment = await db
          .collection("resourceComments")
          .findOne({ _id: new ObjectId(parentId) });
        if (parentComment && parentComment.userId !== session.user.id) {
          await db.collection("notifications").insertOne({
            userId: parentComment.userId,
            type: "comment_reply",
            message: `${session.user.name} replied to your comment`,
            resourceId,
            commentId: result.insertedId,
            fromUser: session.user.id,
            read: false,
            createdAt: new Date(),
          });
        }
      }

      return res.status(201).json({
        success: true,
        comment: {
          ...newComment,
          _id: result.insertedId,
          author,
        },
      });
    }

    if (req.method === "PUT") {
      // Update comment
      if (!session?.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { commentId, content } = req.body;

      if (typeof commentId !== "string" || !ObjectId.isValid(commentId) || typeof content !== "string" || !content.trim() || content.length > 5000) {
        return res
          .status(400)
          .json({ error: "Comment ID and content are required" });
      }

      // Verify ownership
      const comment = await db.collection("resourceComments").findOne({
        _id: new ObjectId(commentId), resourceId,
        userId: session.user.id,
      });

      if (!comment) {
        return res
          .status(404)
          .json({ error: "Comment not found or unauthorized" });
      }

      await db.collection("resourceComments").updateOne(
        { _id: new ObjectId(commentId) },
        {
          $set: {
            content: content.trim(),
            edited: true,
            updatedAt: new Date(),
          },
        }
      );

      return res.status(200).json({
        success: true,
        comment: {
          ...comment,
          content: content.trim(),
          edited: true,
        },
      });
    }

    if (req.method === "DELETE") {
      // Delete comment
      if (!session?.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { commentId } = req.body;

      if (typeof commentId !== "string" || !ObjectId.isValid(commentId)) {
        return res.status(400).json({ error: "Comment ID is required" });
      }

      // Verify ownership
      const comment = await db.collection("resourceComments").findOne({
        _id: new ObjectId(commentId), resourceId,
        userId: session.user.id,
      });

      if (!comment) {
        return res
          .status(404)
          .json({ error: "Comment not found or unauthorized" });
      }

      // Delete comment and all its replies
      await db.collection("resourceComments").deleteMany({
        $or: [{ _id: new ObjectId(commentId) }, { parentId: { $in: [commentId, new ObjectId(commentId)] } }],
      });

      // Delete associated likes
      await db.collection("commentLikes").deleteMany({
        commentId: { $in: [commentId] },
      });

      return res.status(200).json({
        success: true,
        message: "Comment deleted",
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Comments API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default withResourceAccess(handler);
