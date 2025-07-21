import { useState } from 'react';
import toast from 'react-hot-toast';
import TimeAgo from 'timeago-react';
import { DeleteOutline, ThumbUpAltOutlined, ThumbUpAlt } from '@mui/icons-material';
import { motion } from 'framer-motion';

const Post = ({ post, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [liked, setLiked] = useState(() => {
    if (typeof window !== 'undefined') {
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
      return !!likedPosts[post._id];
    }
    return false;
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${post._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete post');
      }

      onDelete(post._id);
      toast.success('Post deleted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to delete post');
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (liked) return;
    
    const newLiked = !liked;
    const newLikes = newLiked ? likes + 1 : likes - 1;
    
    setLiked(newLiked);
    setLikes(newLikes);
    
    // Track like in localStorage for guests
    if (typeof window !== 'undefined') {
      const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '{}');
      if (newLiked) {
        likedPosts[post._id] = true;
      } else {
        delete likedPosts[post._id];
      }
      localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    }
    
    // Send like to API
    try {
      await fetch(`/api/posts/like/${post._id}`, { method: 'POST' });
    } catch (error) {
      console.error('Error updating like:', error);
      // Revert on error
      setLiked(!newLiked);
      setLikes(likes);
    }
  };

  const isAuthor = false; // For now, hide delete for guests

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border-b border-gray-200 dark:border-gray-700 pb-6 mb-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          {post.author?.image ? (
            <img
              src={post.author.image}
              alt={post.author.name}
              className="w-12 h-12 rounded-full border-2 border-gray-300 dark:border-gray-600"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {(post.author?.name || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {post.author?.name || 'Anonymous'}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <TimeAgo datetime={post.createdAt} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            disabled={liked}
            className={`flex items-center gap-1 px-3 py-1 rounded-full transition-all ${
              liked 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
                : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
            title={liked ? 'You liked this' : 'Like'}
          >
            {liked ? <ThumbUpAlt className="w-4 h-4" /> : <ThumbUpAltOutlined className="w-4 h-4" />}
            <span className="text-sm font-medium">{likes}</span>
          </button>
          {isAuthor && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete post"
            >
              <DeleteOutline className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
        {post.content}
      </p>
    </motion.div>
  );
};

export default Post;