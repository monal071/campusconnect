import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FireIcon,
  EyeIcon,
  HeartIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function TrendingSection({ type = "all", limit = 5 }) {
  const [trending, setTrending] = useState({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchTrending();
  }, [type]);

  const fetchTrending = async () => {
    try {
      const response = await fetch(`/api/trending?type=${type}&limit=${limit}`);
      const data = await response.json();

      if (response.ok) {
        setTrending(data);
      }
    } catch (error) {
      console.error("Fetch trending error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item, itemType) => {
    const routes = {
      posts: "/posts",
      resources: "/resources",
      quizzes: "/quiz",
      events: "/events",
      communities: `/communities/${item._id}`,
    };
    router.push(routes[itemType] || "/");
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex space-x-4 pb-4">
        {/* Trending Posts */}
        {(trending.posts || []).map((post, index) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleItemClick(post, "posts")}
            className="flex-shrink-0 w-72 p-4 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
          >
            <div className="flex items-center space-x-2 mb-2">
              <FireIcon className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Popular Post
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-3">
              {post.content}
            </p>
            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <HeartIcon className="h-3 w-3 mr-1" />
                {post.likes || 0}
              </span>
              <span className="flex items-center">
                <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                Trending
              </span>
            </div>
          </motion.div>
        ))}

        {/* Most Viewed Resources */}
        {(trending.resources || []).map((resource, index) => (
          <motion.div
            key={resource._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleItemClick(resource, "resources")}
            className="flex-shrink-0 w-72 p-4 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
          >
            <div className="flex items-center space-x-2 mb-2">
              <EyeIcon className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Top Resource
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3 line-clamp-2">
              {resource.title}
            </p>
            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <EyeIcon className="h-3 w-3 mr-1" />
                {resource.views || 0}
              </span>
              <span className="flex items-center">
                <HeartIcon className="h-3 w-3 mr-1" />
                {resource.likes || 0}
              </span>
            </div>
          </motion.div>
        ))}

        {/* Popular Quizzes */}
        {(trending.quizzes || []).map((quiz, index) => (
          <motion.div
            key={quiz._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleItemClick(quiz, "quizzes")}
            className="flex-shrink-0 w-72 p-4 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
          >
            <div className="flex items-center space-x-2 mb-2">
              <ArrowTrendingUpIcon className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Popular Quiz
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3 line-clamp-2">
              {quiz.quizName}
            </p>
            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <UserGroupIcon className="h-3 w-3 mr-1" />
                {quiz.submissionCount || 0} taken
              </span>
            </div>
          </motion.div>
        ))}

        {/* Popular Communities */}
        {(trending.communities || []).map((community, index) => (
          <motion.div
            key={community._id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleItemClick(community, "communities")}
            className="flex-shrink-0 w-72 p-4 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-gray-200 dark:border-gray-600 shadow-sm"
          >
            <div className="flex items-center space-x-2 mb-2">
              <UserGroupIcon className="h-4 w-4 text-green-500" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Growing Community
              </span>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-3 line-clamp-2">
              {community.name}
            </p>
            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <UserGroupIcon className="h-3 w-3 mr-1" />
                {community.memberCount || 0} members
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
