import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PostForm from './PostForm';
import Post from './Post';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    // Detect guest session
    if (typeof window !== 'undefined') {
      const guest = localStorage.getItem('guest');
      setIsGuest(!!guest);
      const storedName = localStorage.getItem('guestName');
      if (storedName) setGuestName(storedName);
    }
  }, []);

  useEffect(() => {
    // Load posts from API
    const loadPosts = async () => {
      setIsLoading(true);
      try {
        // Replace with your API call
        const response = await fetch('/api/posts');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Error loading posts:', error);
        setError('Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, []);

  // Save guest name to localStorage
  useEffect(() => {
    if (isGuest && guestName) {
      localStorage.setItem('guestName', guestName);
    }
  }, [isGuest, guestName]);

  const handlePostCreated = async (content, name) => {
    try {
      const newPost = {
        content: content.trim(),
        author: isGuest ? { name: name || guestName } : undefined,
      };

      // Replace with your API call
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPost),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const savedPost = await response.json();
      setPosts((prevPosts) => [savedPost, ...prevPosts]);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    }
  };

  const handlePostDeleted = async (postId) => {
    try {
      // Replace with your API call
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
      toast.success('Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="space-y-6">
      <PostForm
        onSubmit={handlePostCreated}
        isGuest={isGuest}
        guestName={guestName}
        setGuestName={setGuestName}
      />
      <div className="space-y-4">
        {posts.map((post) => (
          <Post
            key={post._id}
            post={post}
            onDelete={handlePostDeleted}
            // currentUser={mockUser} // Uncomment if currentUser is needed
          />
        ))}
        {posts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No posts yet. Be the first to post something!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;