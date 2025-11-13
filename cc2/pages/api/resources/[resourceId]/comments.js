import { connectToDatabase } from '../../../../utils/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  const { resourceId } = req.query;

  if (!resourceId) {
    return res.status(400).json({ error: 'Resource ID is required' });
  }

  const session = await getServerSession(req, res, authOptions);

  try {
    const { db } = await connectToDatabase();

    if (req.method === 'GET') {
      // Get all comments for a resource
      const { sortBy = 'recent' } = req.query;

      const sortOption = sortBy === 'popular' 
        ? { likes: -1, createdAt: -1 }
        : { createdAt: -1 };

      const comments = await db.collection('resourceComments')
        .find({ resourceId, parentId: null })
        .sort(sortOption)
        .toArray();

      // Get author details and replies for each comment
      const commentsWithDetails = await Promise.all(
        comments.map(async (comment) => {
          const author = await db.collection('users')
            .findOne({ _id: comment.userId })
            .project({ name: 1, email: 1, image: 1 });

          // Get replies
          const replies = await db.collection('resourceComments')
            .find({ parentId: comment._id })
            .sort({ createdAt: 1 })
            .toArray();

          const repliesWithAuthors = await Promise.all(
            replies.map(async (reply) => {
              const replyAuthor = await db.collection('users')
                .findOne({ _id: reply.userId })
                .project({ name: 1, email: 1, image: 1 });

              // Check if current user liked this reply
              const isLiked = session?.user ? await db.collection('commentLikes').findOne({
                commentId: reply._id,
                userId: session.user.id,
              }) !== null : false;

              return {
                ...reply,
                author: replyAuthor,
                isLiked,
              };
            })
          );

          // Check if current user liked this comment
          const isLiked = session?.user ? await db.collection('commentLikes').findOne({
            commentId: comment._id,
            userId: session.user.id,
          }) !== null : false;

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

    if (req.method === 'POST') {
      // Create new comment
      if (!session?.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { content, parentId = null } = req.body;

      if (!content?.trim()) {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      const newComment = {
        resourceId,
        userId: session.user.id,
        content: content.trim(),
        parentId,
        likes: 0,
        edited: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('resourceComments').insertOne(newComment);

      // Get author details
      const author = await db.collection('users')
        .findOne({ _id: session.user.id })
        .project({ name: 1, email: 1, image: 1 });

      // Create notification for resource owner (if not self-comment)
      const resource = await db.collection('resources').findOne({ _id: resourceId });
      if (resource && resource.createdBy !== session.user.id) {
        await db.collection('notifications').insertOne({
          userId: resource.createdBy,
          type: 'resource_comment',
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
        const parentComment = await db.collection('resourceComments').findOne({ _id: parentId });
        if (parentComment && parentComment.userId !== session.user.id) {
          await db.collection('notifications').insertOne({
            userId: parentComment.userId,
            type: 'comment_reply',
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

    if (req.method === 'PUT') {
      // Update comment
      if (!session?.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { commentId, content } = req.body;

      if (!commentId || !content?.trim()) {
        return res.status(400).json({ error: 'Comment ID and content are required' });
      }

      // Verify ownership
      const comment = await db.collection('resourceComments').findOne({
        _id: commentId,
        userId: session.user.id,
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found or unauthorized' });
      }

      await db.collection('resourceComments').updateOne(
        { _id: commentId },
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

    if (req.method === 'DELETE') {
      // Delete comment
      if (!session?.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { commentId } = req.body;

      if (!commentId) {
        return res.status(400).json({ error: 'Comment ID is required' });
      }

      // Verify ownership
      const comment = await db.collection('resourceComments').findOne({
        _id: commentId,
        userId: session.user.id,
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found or unauthorized' });
      }

      // Delete comment and all its replies
      await db.collection('resourceComments').deleteMany({
        $or: [
          { _id: commentId },
          { parentId: commentId },
        ],
      });

      // Delete associated likes
      await db.collection('commentLikes').deleteMany({
        commentId: { $in: [commentId] },
      });

      return res.status(200).json({
        success: true,
        message: 'Comment deleted',
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Comments API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
