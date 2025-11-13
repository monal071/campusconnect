import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  BookmarkIcon,
  DocumentTextIcon,
  FolderIcon,
  AcademicCapIcon,
  CalendarIcon,
  BriefcaseIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const BOOKMARK_TYPES = {
  post: { icon: DocumentTextIcon, label: 'Posts', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  resource: { icon: FolderIcon, label: 'Resources', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  quiz: { icon: AcademicCapIcon, label: 'Quizzes', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  event: { icon: CalendarIcon, label: 'Events', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  job: { icon: BriefcaseIcon, label: 'Jobs', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300' }
};

export default function Bookmarks() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchBookmarks();
    }
  }, [status, filterType]);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookmarks?type=${filterType}`);
      const data = await response.json();
      
      if (response.ok) {
        setBookmarks(data.bookmarks || []);
      } else {
        toast.error(data.error || 'Failed to fetch bookmarks');
      }
    } catch (error) {
      console.error('Fetch bookmarks error:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (itemId, type) => {
    try {
      const response = await fetch(`/api/bookmarks?itemId=${itemId}&type=${type}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setBookmarks(prev => prev.filter(b => !(b.itemId === itemId && b.type === type)));
        toast.success('Bookmark removed');
      } else {
        toast.error('Failed to remove bookmark');
      }
    } catch (error) {
      console.error('Remove bookmark error:', error);
      toast.error('Failed to remove bookmark');
    }
  };

  const handleBookmarkClick = (bookmark) => {
    const routes = {
      post: '/posts',
      resource: '/resources',
      quiz: '/quiz',
      event: '/events',
      job: '/jobs'
    };
    
    router.push(routes[bookmark.type] || '/');
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <BookmarkIcon className="h-8 w-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Saved Items
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Access your bookmarked posts, resources, quizzes, events, and jobs
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            All ({bookmarks.length})
          </button>
          {Object.entries(BOOKMARK_TYPES).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setFilterType(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filterType === key
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Bookmarks List */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-12">
            <BookmarkIcon className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No bookmarks yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Start saving items to access them later
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.map((bookmark, index) => {
              const { icon: Icon, color } = BOOKMARK_TYPES[bookmark.type];
              const item = bookmark.item;
              
              if (!item) return null;

              return (
                <motion.div
                  key={bookmark._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <div onClick={() => handleBookmarkClick(bookmark)}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBookmark(bookmark.itemId, bookmark.type);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {item.title || item.quizName || item.content?.substring(0, 100) || item.name || 'Untitled'}
                    </h3>

                    {item.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="capitalize">{bookmark.type}</span>
                      <span>
                        {new Date(bookmark.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
