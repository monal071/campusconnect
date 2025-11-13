import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlusIcon, UserMinusIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function FollowButton({ userId, initialIsFollowing = false, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    checkFollowingStatus();
  }, [userId]);

  const checkFollowingStatus = async () => {
    try {
      const response = await fetch(`/api/users/follow/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error('Error checking following status:', error);
    }
  };

  const handleToggleFollow = async (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    if (loading) return;

    setLoading(true);
    
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/follow/${userId}`, {
        method,
      });

      if (response.ok) {
        const newStatus = !isFollowing;
        setIsFollowing(newStatus);
        
        if (onFollowChange) {
          onFollowChange(newStatus);
        }

        toast.success(newStatus ? '✓ Following' : 'Unfollowed');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      toast.error('Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={handleToggleFollow}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={loading}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${isFollowing 
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400' 
          : 'bg-blue-500 hover:bg-blue-600 text-white'
        }
      `}
    >
      {isFollowing ? (
        <>
          {isHovering ? (
            <>
              <UserMinusIcon className="h-4 w-4" />
              <span>Unfollow</span>
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4" />
              <span>Following</span>
            </>
          )}
        </>
      ) : (
        <>
          <UserPlusIcon className="h-4 w-4" />
          <span>Follow</span>
        </>
      )}
    </motion.button>
  );
}

// Compact version for smaller spaces
export function FollowButtonCompact({ userId, initialIsFollowing = false, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkFollowingStatus();
  }, [userId]);

  const checkFollowingStatus = async () => {
    try {
      const response = await fetch(`/api/users/follow/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.isFollowing);
      }
    } catch (error) {
      console.error('Error checking following status:', error);
    }
  };

  const handleToggleFollow = async (e) => {
    e.stopPropagation();
    
    if (loading) return;

    setLoading(true);
    
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const response = await fetch(`/api/users/follow/${userId}`, {
        method,
      });

      if (response.ok) {
        const newStatus = !isFollowing;
        setIsFollowing(newStatus);
        
        if (onFollowChange) {
          onFollowChange(newStatus);
        }

        toast.success(newStatus ? '✓ Following' : 'Unfollowed');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      toast.error('Failed to update follow status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`
        p-2 rounded-full transition-colors
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${isFollowing 
          ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-red-100 dark:hover:bg-red-900/30' 
          : 'bg-blue-500 hover:bg-blue-600 text-white'
        }
      `}
    >
      {isFollowing ? (
        <CheckIcon className="h-5 w-5" />
      ) : (
        <UserPlusIcon className="h-5 w-5" />
      )}
    </button>
  );
}
