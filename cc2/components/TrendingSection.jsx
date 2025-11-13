import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FireIcon,
  EyeIcon,
  HeartIcon,
  UserGroupIcon,
  TrendingUpIcon,
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <FireIcon className="h-6 w-6 text-orange-500" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Trending Now
        </h2>
      </div>

      <div className="space-y-4">
        {/* Trending Posts */}
        {trending.posts && trending.posts.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Popular Posts
            </h3>
            <div className="space-y-2">
              {trending.posts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleItemClick(post, "posts")}
                  className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-gray-100 dark:border-gray-600"
                >
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                    {post.content}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <HeartIcon className="h-3 w-3 mr-1" />
                      {post.likes || 0}
                    </span>
                    <span className="flex items-center">
                      <TrendingUpIcon className="h-3 w-3 mr-1" />
                      Trending
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Most Viewed Resources */}
        {trending.resources && trending.resources.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Top Resources
            </h3>
            <div className="space-y-2">
              {trending.resources.map((resource, index) => (
                <motion.div
                  key={resource._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleItemClick(resource, "resources")}
                  className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-gray-100 dark:border-gray-600"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {resource.title}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <EyeIcon className="h-3 w-3 mr-1" />
                      {resource.views || 0} views
                    </span>
                    <span className="flex items-center">
                      <HeartIcon className="h-3 w-3 mr-1" />
                      {resource.likes || 0}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Quizzes */}
        {trending.quizzes && trending.quizzes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Popular Quizzes
            </h3>
            <div className="space-y-2">
              {trending.quizzes.map((quiz, index) => (
                <motion.div
                  key={quiz._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleItemClick(quiz, "quizzes")}
                  className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-gray-100 dark:border-gray-600"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
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
            </div>
          </div>
        )}

        {/* Popular Communities */}
        {trending.communities && trending.communities.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
              Growing Communities
            </h3>
            <div className="space-y-2">
              {trending.communities.map((community, index) => (
                <motion.div
                  key={community._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleItemClick(community, "communities")}
                  className="p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border border-gray-100 dark:border-gray-600"
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
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
        )}
      </div>
    </div>
  );
}
