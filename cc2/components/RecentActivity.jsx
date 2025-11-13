import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import {
  ChatBubbleLeftIcon,
  HeartIcon,
  UserPlusIcon,
  DocumentTextIcon,
  CalendarIcon,
  BookmarkIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const activityIcons = {
  post: ChatBubbleLeftIcon,
  like: HeartIcon,
  comment: ChatBubbleLeftIcon,
  connection: UserPlusIcon,
  resource: DocumentTextIcon,
  event: CalendarIcon,
  bookmark: BookmarkIcon,
  quiz: AcademicCapIcon,
  job: BriefcaseIcon,
  follow: UserGroupIcon,
};

const activityColors = {
  post: 'text-blue-500 bg-blue-100 dark:bg-blue-900/20',
  like: 'text-red-500 bg-red-100 dark:bg-red-900/20',
  comment: 'text-green-500 bg-green-100 dark:bg-green-900/20',
  connection: 'text-purple-500 bg-purple-100 dark:bg-purple-900/20',
  resource: 'text-orange-500 bg-orange-100 dark:bg-orange-900/20',
  event: 'text-pink-500 bg-pink-100 dark:bg-pink-900/20',
  bookmark: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20',
  quiz: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/20',
  job: 'text-teal-500 bg-teal-100 dark:bg-teal-900/20',
  follow: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/20',
};

export default function RecentActivity({ userId, limit = 10 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${userId}/activities?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch activities');
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-red-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Recent Activity
        </h2>
      </div>

      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <ActivityItem key={activity._id || index} activity={activity} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityItem({ activity }) {
  const Icon = activityIcons[activity.type] || ChatBubbleLeftIcon;
  const colorClass = activityColors[activity.type] || activityColors.post;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex space-x-3 group"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-900 dark:text-white">
              {activity.link ? (
                <Link
                  href={activity.link}
                  className="hover:underline font-medium"
                >
                  {activity.description}
                </Link>
              ) : (
                <span className="font-medium">{activity.description}</span>
              )}
            </p>
            {activity.details && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {activity.details}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 whitespace-nowrap">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// Compact version for sidebar
export function RecentActivityCompact({ userId, limit = 5 }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [userId]);

  const fetchActivities = async () => {
    try {
      const res = await fetch(`/api/users/${userId}/activities?limit=${limit}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || activities.length === 0) return null;

  return (
    <div className="space-y-2">
      {activities.map((activity, index) => {
        const Icon = activityIcons[activity.type] || ChatBubbleLeftIcon;
        const colorClass = activityColors[activity.type] || activityColors.post;

        return (
          <div key={activity._id || index} className="flex items-start space-x-2">
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${colorClass}`}>
              <Icon className="w-3 h-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {activity.description}
              </p>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Activity feed for dashboard
export function ActivityFeed({ limit = 20, filter = 'all' }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [filter, page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/activities?limit=${limit}&page=${page}&filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        if (page === 1) {
          setActivities(data.activities || []);
        } else {
          setActivities((prev) => [...prev, ...(data.activities || [])]);
        }
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <ActivityItem key={activity._id || index} activity={activity} />
      ))}

      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!loading && hasMore && (
        <button
          onClick={loadMore}
          className="w-full py-2 text-sm text-blue-500 hover:text-blue-600 font-medium"
        >
          Load More
        </button>
      )}

      {!loading && !hasMore && activities.length > 0 && (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          No more activities
        </p>
      )}
    </div>
  );
}
