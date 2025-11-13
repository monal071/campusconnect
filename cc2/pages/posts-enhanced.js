import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Post from '../components/Post';
import PostForm from '../components/PostForm';
import AdvancedFilters from '../components/AdvancedFilters';
import { NoPosts } from '../components/EmptyStates';
import { SkeletonPost } from '../components/SkeletonLoaders';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import FloatingActionButton from '../components/FloatingActionButton';
import { 
  AdjustmentsHorizontalIcon,
  FireIcon,
  ClockIcon,
  HeartIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';

export default function Posts() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [filters, setFilters] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Infinite scroll
  const loadMoreRef = useRef(null);
  const { isIntersecting } = useInfiniteScroll(loadMoreRef);

  useEffect(() => {
    loadPosts(1);
  }, []);

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      loadPosts(page + 1);
    }
  }, [isIntersecting, hasMore, loading]);

  const loadPosts = async (pageNum) => {
    if (loading && pageNum > 1) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/posts?page=${pageNum}&limit=10`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Failed to load posts');
      
      const newPosts = data.data || [];
      
      if (pageNum === 1) {
        setPosts(newPosts);
        setFilteredPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setFilteredPosts(prev => [...prev, ...newPosts]);
      }
      
      setPage(pageNum);
      setHasMore(newPosts.length === 10);
    } catch (e) {
      console.error('Failed to load posts:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (appliedFilters) => {
    setFilters(appliedFilters);
    
    let filtered = [...posts];
    
    // Apply date filter
    if (appliedFilters.dateRange && appliedFilters.dateRange !== 'all') {
      const now = new Date();
      const dateLimit = new Date();
      
      switch (appliedFilters.dateRange) {
        case 'today':
          dateLimit.setHours(0, 0, 0, 0);
          break;
        case 'week':
          dateLimit.setDate(now.getDate() - 7);
          break;
        case 'month':
          dateLimit.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(post => new Date(post.createdAt) >= dateLimit);
    }
    
    // Apply tag filter
    if (appliedFilters.tags && appliedFilters.tags.length > 0) {
      filtered = filtered.filter(post => 
        post.tags && post.tags.some(tag => appliedFilters.tags.includes(tag))
      );
    }
    
    // Apply sort
    const sortOption = appliedFilters.sortBy || sortBy;
    setSortBy(sortOption);
    
    filtered = sortPosts(filtered, sortOption);
    
    setFilteredPosts(filtered);
    setShowFilters(false);
  };

  const sortPosts = (postsToSort, sortOption) => {
    const sorted = [...postsToSort];
    
    switch (sortOption) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'popular':
        return sorted.sort((a, b) => {
          const aScore = (a.likes?.length || 0) + (a.comments?.length || 0) * 2;
          const bScore = (b.likes?.length || 0) + (b.comments?.length || 0) * 2;
          return bScore - aScore;
        });
      case 'most-liked':
        return sorted.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      case 'most-viewed':
        return sorted.sort((a, b) => (b.views || 0) - (a.views || 0));
      default:
        return sorted;
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
    setFilteredPosts(prev => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
    setFilteredPosts(prev => prev.filter(p => p._id !== postId));
  };

  const sortOptions = [
    { value: 'recent', label: 'Most Recent', icon: ClockIcon },
    { value: 'popular', label: 'Most Popular', icon: FireIcon },
    { value: 'most-liked', label: 'Most Liked', icon: HeartIcon },
    { value: 'most-viewed', label: 'Most Viewed', icon: EyeIcon },
  ];

  return (
    <div className="w-full min-h-screen py-8 px-4 sm:px-6 lg:px-8" data-tour="posts">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Community Posts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share updates, ask questions, and connect with your community
          </p>
        </div>

        {/* Create Post */}
        {session && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <PostForm onPostCreated={handlePostCreated} />
          </motion.div>
        )}

        {/* Filters Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 flex flex-wrap items-center gap-4">
          {/* Sort Options */}
          <div className="flex items-center gap-2 flex-wrap">
            {sortOptions.map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value);
                    setFilteredPosts(sortPosts(filteredPosts, option.value));
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortBy === option.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Advanced Filters Button */}
          <button
            onClick={() => setShowFilters(true)}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors"
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
            Advanced Filters
          </button>
        </div>

        {/* Active Filters Display */}
        {filters && (filters.tags?.length > 0 || filters.dateRange !== 'all') && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
            {filters.dateRange && filters.dateRange !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                {filters.dateRange}
              </span>
            )}
            {filters.tags?.map(tag => (
              <span key={tag} className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                #{tag}
              </span>
            ))}
            <button
              onClick={() => {
                setFilters(null);
                setFilteredPosts(posts);
              }}
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Posts List */}
        {loading && page === 1 ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <SkeletonPost key={i} />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <NoPosts onCreate={() => document.querySelector('[data-tour="create-post"]')?.focus()} />
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Post post={post} onDelete={handlePostDeleted} />
              </motion.div>
            ))}

            {/* Infinite Scroll Trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className="py-8 text-center">
                {loading && <SkeletonPost />}
              </div>
            )}

            {!hasMore && filteredPosts.length > 0 && (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                You've reached the end!
              </div>
            )}
          </div>
        )}

        {/* Advanced Filters Modal */}
        {showFilters && (
          <AdvancedFilters
            onApplyFilters={handleApplyFilters}
            onClose={() => setShowFilters(false)}
            contentType="posts"
          />
        )}

        {/* Floating Action Button */}
        <FloatingActionButton position="bottom-right" />
      </div>
    </div>
  );
}
