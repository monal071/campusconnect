import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  ChatBubbleLeftIcon,
  HeartIcon,
  TrashIcon,
  PencilIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function ResourceComments({ resourceId }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // recent, popular

  useEffect(() => {
    if (resourceId) {
      fetchComments();
    }
  }, [resourceId, sortBy]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/comments?sortBy=${sortBy}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      const res = await fetch(`/api/resources/${resourceId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          parentId: replyTo?._id || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (replyTo) {
          // Add reply to parent comment
          setComments(comments.map(comment => 
            comment._id === replyTo._id
              ? { ...comment, replies: [...(comment.replies || []), data.comment] }
              : comment
          ));
        } else {
          // Add new top-level comment
          setComments([data.comment, ...comments]);
        }

        setNewComment('');
        setReplyTo(null);
        toast.success('Comment posted!');
      } else {
        throw new Error('Failed to post comment');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to post comment');
    }
  };

  const handleEditComment = async (commentId, newContent) => {
    try {
      const res = await fetch(`/api/resources/${resourceId}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          content: newContent.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments(comments.map(comment =>
          comment._id === commentId
            ? { ...comment, content: data.comment.content, edited: true }
            : {
                ...comment,
                replies: comment.replies?.map(reply =>
                  reply._id === commentId
                    ? { ...reply, content: data.comment.content, edited: true }
                    : reply
                ),
              }
        ));
        setEditingComment(null);
        toast.success('Comment updated');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId, isReply = false, parentId = null) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const res = await fetch(`/api/resources/${resourceId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });

      if (res.ok) {
        if (isReply && parentId) {
          setComments(comments.map(comment =>
            comment._id === parentId
              ? {
                  ...comment,
                  replies: comment.replies.filter(reply => reply._id !== commentId),
                }
              : comment
          ));
        } else {
          setComments(comments.filter(comment => comment._id !== commentId));
        }
        toast.success('Comment deleted');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete comment');
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!session?.user) {
      toast.error('Please login to like comments');
      return;
    }

    try {
      const res = await fetch(`/api/resources/${resourceId}/comments/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });

      if (res.ok) {
        const data = await res.json();
        
        setComments(comments.map(comment =>
          comment._id === commentId
            ? { ...comment, likes: data.likes, isLiked: data.isLiked }
            : {
                ...comment,
                replies: comment.replies?.map(reply =>
                  reply._id === commentId
                    ? { ...reply, likes: data.likes, isLiked: data.isLiked }
                    : reply
                ),
              }
        ));
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to like comment');
    }
  };

  const handleReportComment = async (commentId) => {
    const reason = prompt('Why are you reporting this comment?');
    if (!reason) return;

    try {
      const res = await fetch(`/api/resources/${resourceId}/comments/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, reason }),
      });

      if (res.ok) {
        toast.success('Comment reported');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to report comment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ChatBubbleLeftIcon className="w-6 h-6" />
          Comments ({comments.length})
        </h3>

        {/* Sort Options */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
        >
          <option value="recent">Most Recent</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* Comment Form */}
      {session?.user && (
        <form onSubmit={handleSubmitComment} className="space-y-3">
          {replyTo && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Replying to {replyTo.author.name}</span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <img
              src={session.user.image || '/default-avatar.png'}
              alt={session.user.name}
              className="w-10 h-10 rounded-full flex-shrink-0"
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? 'Write a reply...' : 'Add a comment...'}
                rows="3"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                {replyTo && (
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {replyTo ? 'Reply' : 'Comment'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onReply={setReplyTo}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              onLike={handleLikeComment}
              onReport={handleReportComment}
              editingComment={editingComment}
              setEditingComment={setEditingComment}
              currentUserId={session?.user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onReport,
  editingComment,
  setEditingComment,
  currentUserId,
  isReply = false,
  parentId = null,
}) {
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(true);

  const isAuthor = currentUserId === comment.author._id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${isReply ? 'ml-12' : ''}`}
    >
      <div className="flex gap-3">
        <img
          src={comment.author.image || '/default-avatar.png'}
          alt={comment.author.name}
          className="w-10 h-10 rounded-full flex-shrink-0"
        />

        <div className="flex-1 space-y-2">
          {/* Author & Time */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">
              {comment.author.name}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(comment.createdAt).toLocaleDateString()}
              {comment.edited && ' (edited)'}
            </span>
          </div>

          {/* Content */}
          {editingComment === comment._id ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                rows="3"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onEdit(comment._id, editContent);
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingComment(null);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => onLike(comment._id)}
              className={`flex items-center gap-1 transition-colors ${
                comment.isLiked
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              {comment.isLiked ? (
                <HeartSolidIcon className="w-4 h-4" />
              ) : (
                <HeartIcon className="w-4 h-4" />
              )}
              <span>{comment.likes || 0}</span>
            </button>

            {!isReply && (
              <button
                onClick={() => onReply(comment)}
                className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Reply
              </button>
            )}

            {isAuthor && (
              <>
                <button
                  onClick={() => setEditingComment(comment._id)}
                  className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(comment._id, isReply, parentId)}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}

            {!isAuthor && (
              <button
                onClick={() => onReport(comment._id)}
                className="text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors flex items-center gap-1"
              >
                <FlagIcon className="w-4 h-4" />
                Report
              </button>
            )}
          </div>

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="space-y-4 mt-4">
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showReplies ? 'Hide' : 'Show'} {comment.replies.length}{' '}
                {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>

              <AnimatePresence>
                {showReplies && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    {comment.replies.map(reply => (
                      <CommentItem
                        key={reply._id}
                        comment={reply}
                        onReply={onReply}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onLike={onLike}
                        onReport={onReport}
                        editingComment={editingComment}
                        setEditingComment={setEditingComment}
                        currentUserId={currentUserId}
                        isReply={true}
                        parentId={comment._id}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
