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
      className="card p-4 mb-4 animate-fade-in"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          {post.author?.image ? (
            <img
              src={post.author.image}
              alt={post.author.name}
              className="avatar"
            />
          ) : (
            <div className="avatar avatar-initial">
              {(post.author?.name || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {post.author?.name || 'Anonymous'}
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              <TimeAgo datetime={post.createdAt} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            disabled={liked}
            className={`btn-icon ${
              liked 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover-scale'
            }`}
            title={liked ? 'You liked this' : 'Like'}
          >
            {liked ? <ThumbUpAlt className="w-5 h-5" /> : <ThumbUpAltOutlined className="w-5 h-5" />}
            <span className="text-sm font-medium ml-1">{likes}</span>
          </button>
          {isAuthor && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn-icon text-red-500 hover:text-red-600 dark:hover:text-red-400 hover-scale"
              title="Delete post"
            >
              <DeleteOutline className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
        {post.content}
      </p>
    </motion.div>
  );
};

export default Post;