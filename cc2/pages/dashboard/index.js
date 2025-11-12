import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import UserNotifications from "../../components/UserNotifications";

// Heroicons
import {
  CalendarIcon,
  BriefcaseIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BookOpenIcon,
  NewspaperIcon,
  PencilIcon,
  AcademicCapIcon,
  PlayIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    connections: 0,
    posts: 0,
    events: 0,
    resources: 0,
    jobs: 0,
    quizzes: {
      totalQuizzes: 0,
      activeQuizzes: 0,
    },
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  // Check if user is authenticated and set up real-time updates
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchDashboardData();

      // Set up real-time updates every 30 seconds
      const interval = setInterval(() => {
        fetchDashboardData();
      }, 30000);

      // Refresh when page becomes visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          fetchDashboardData();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        clearInterval(interval);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, [status, router]);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch user stats with cache busting
      const statsRes = await fetch(`/api/dashboard/stats?_t=${Date.now()}`, {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const statsData = await statsRes.json();
      if (statsRes.ok && statsData.data) {
        console.log("Dashboard stats received:", statsData.data);
        setStats(statsData.data);
      } else {
        console.error("Failed to fetch stats:", statsData);
        setStats({
          connections: 0,
          posts: 0,
          events: 0,
          resources: 0,
          jobs: 0,
          quizzes: {
            totalQuizzes: 0,
            activeQuizzes: 0,
          },
        });
      }

      // Fetch recent activity
      const activityRes = await fetch("/api/dashboard/activity");
      const activityData = await activityRes.json();
      if (activityRes.ok && activityData.data) {
        setRecentActivity(activityData.data || []);
      } else {
        setRecentActivity([]);
      }

      // Fetch upcoming events that user has joined
      const eventsRes = await fetch("/api/events");
      const eventsData = await eventsRes.json();
      if (eventsRes.ok && session?.user?.id) {
        // Filter events where user has joined and are upcoming
        const userEvents = (eventsData || []).filter((event) => {
          const isJoined =
            event.joined && event.joined.includes(session.user.id);
          const isUpcoming = new Date(event.date) > new Date();
          return isJoined && isUpcoming;
        });
        setUpcomingEvents(userEvents.slice(0, 3));
      } else {
        setUpcomingEvents([]);
      }

      // Fetch pending community join requests
      const requestsRes = await fetch("/api/communities/requests/pending");
      const requestsData = await requestsRes.json();
      if (requestsRes.ok && requestsData.requests) {
        setPendingRequests(requestsData.requests);
      } else {
        setPendingRequests([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set empty arrays instead of dummy data
      setStats({
        connections: 0,
        posts: 0,
        events: 0,
        resources: 0,
        jobs: 0,
      });
      setRecentActivity([]);
      setUpcomingEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // All dummy data generation functions have been removed to only use real-time data

  // Format date for display
  const formatDate = (dateString) => {
    const options = { month: "short", day: "numeric", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  // Format time ago for activity feed
  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1)
      return interval + " year" + (interval === 1 ? "" : "s") + " ago";

    interval = Math.floor(seconds / 2592000);
    if (interval >= 1)
      return interval + " month" + (interval === 1 ? "" : "s") + " ago";

    interval = Math.floor(seconds / 86400);
    if (interval >= 1)
      return interval + " day" + (interval === 1 ? "" : "s") + " ago";

    interval = Math.floor(seconds / 3600);
    if (interval >= 1)
      return interval + " hour" + (interval === 1 ? "" : "s") + " ago";

    interval = Math.floor(seconds / 60);
    if (interval >= 1)
      return interval + " minute" + (interval === 1 ? "" : "s") + " ago";

    return "just now";
  };

  // Get icon component for activity
  const getActivityIcon = (iconName) => {
    switch (iconName) {
      case "PeopleIcon":
        return <UserGroupIcon />;
      case "ArticleIcon":
        return <NewspaperIcon />;
      case "EventIcon":
        return <CalendarIcon />;
      case "MenuBookIcon":
        return <BookOpenIcon />;
      case "WorkIcon":
        return <BriefcaseIcon />;
      default:
        return <NewspaperIcon />;
    }
  };

  // Handle approve join request
  const handleApprove = async (communityId, requesterId) => {
    try {
      const res = await fetch(`/api/communities/${communityId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      });

      if (res.ok) {
        // Refresh pending requests
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  // Handle decline join request
  const handleDecline = async (communityId, requesterId) => {
    try {
      const res = await fetch(`/api/communities/${communityId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      });

      if (res.ok) {
        // Refresh pending requests
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error declining request:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading your dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 gap-8">
        {/* Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 sm:p-10 shadow-lg text-white"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold">
                Welcome back, {session?.user?.name || "User"}!
              </h1>
              <p className="mt-2 text-indigo-100">
                Here's what's been happening in your campus community.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 relative">
                <Image
                  src={session?.user?.image || "/default-avatar.png"}
                  alt="Profile"
                  width={64}
                  height={64}
                  className="rounded-full border-2 border-white"
                />
                {session?.user?.role === "admin" && (
                  <span className="absolute -bottom-1 -right-1 bg-yellow-400 text-xs text-gray-900 font-bold px-2 py-0.5 rounded-full">
                    ADMIN
                  </span>
                )}
                {session?.user?.role === "student" && (
                  <span className="absolute -bottom-1 -right-1 bg-blue-400 text-xs text-white font-bold px-2 py-0.5 rounded-full">
                    STUDENT
                  </span>
                )}
                {session?.user?.role === "faculty" && (
                  <span className="absolute -bottom-1 -right-1 bg-green-400 text-xs text-white font-bold px-2 py-0.5 rounded-full">
                    FACULTY
                  </span>
                )}
              </div>
              <Link
                href="/profile"
                className="bg-white bg-opacity-25 hover:bg-opacity-40 transition-colors duration-200 py-2 px-4 rounded-lg text-sm font-medium"
              >
                <div className="flex items-center">
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Profile
                </div>
              </Link>
            </div>
          </div>
        </motion.section>

        {/* Quiz Stats Section - Only show for faculty */}
        {(session?.user?.role === "faculty" ||
          session?.user?.role === "admin") && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {/* Total Quizzes */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col items-center">
                <div className="rounded-full bg-indigo-100 dark:bg-indigo-900 p-3 mb-2">
                  <AcademicCapIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.quizzes?.totalQuizzes || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  My Quizzes
                </div>
              </div>

              {/* Active Quizzes */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col items-center">
                <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mb-2">
                  <PlayIcon className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.quizzes?.activeQuizzes || 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Active
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Pending Approvals Section */}
        {pendingRequests.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl shadow-md p-6 border-2 border-yellow-200 dark:border-yellow-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-yellow-100 dark:bg-yellow-900/40 p-2">
                <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Pending Approvals
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {pendingRequests.length} join request
                  {pendingRequests.length !== 1 ? "s" : ""} waiting
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map((request) => (
                <div
                  key={`${request.communityId}-${request.requester.id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg p-4 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Image
                      src={request.requester.image || "/default-avatar.png"}
                      alt={request.requester.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {request.requester.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        wants to join{" "}
                        <span className="font-medium text-indigo-600 dark:text-indigo-400">
                          {request.communityName}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleApprove(request.communityId, request.requester.id)
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        handleDecline(request.communityId, request.requester.id)
                      }
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pendingRequests.length > 5 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +{pendingRequests.length - 5} more pending request
                  {pendingRequests.length - 5 !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </motion.section>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - My Connections */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                My Connections
              </h2>
              <div className="space-y-4">
                {stats.connections > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                          <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Total Connections
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {stats.connections} people
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400 font-bold">
                            +
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Find New Connections
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Discover people to connect
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/connections"
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                      >
                        <span className="text-xl">→</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UserGroupIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      No connections yet
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                      Start building your network!
                    </p>
                    <Link
                      href="/connections"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Find Connections
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* User Notifications */}
            <UserNotifications />
          </motion.section>

          {/* Middle Column - My Events and Posts */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  My Joined Events
                </h2>
                <CalendarIcon className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <div
                      key={event._id}
                      className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0 last:pb-0"
                    >
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium text-indigo-600 dark:text-indigo-400 mr-2">
                          {formatDate(event.date)}
                        </span>
                        <span>• {event.location}</span>
                      </div>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          ✓ Joined
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      No joined events
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                      Join events to see them here
                    </p>
                    <Link
                      href="/events"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Browse Events
                    </Link>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link
                  href="/events"
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                >
                  View all events →
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  My Posts
                </h2>
                <NewspaperIcon className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="space-y-4">
                {stats.posts > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                          <NewspaperIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Total Posts
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {stats.posts} posts shared
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400 font-bold">
                            +
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Create New Post
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Share your thoughts
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/posts/create"
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                      >
                        <span className="text-xl">→</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                      <NewspaperIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      No posts yet
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                      Share your first post!
                    </p>
                    <Link
                      href="/posts/create"
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create Post
                    </Link>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link
                  href="/posts"
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                >
                  View all posts →
                </Link>
              </div>
            </div>
          </motion.section>

          {/* Right Column - My Resources and Quick Actions */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-1 space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  My Resources
                </h2>
                <BookOpenIcon className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="space-y-4">
                {stats.resources > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                          <BookOpenIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Shared Resources
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {stats.resources} resources
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400 font-bold">
                            +
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Share New Resource
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Help others learn
                          </p>
                        </div>
                      </div>
                      <Link
                        href="/resources/share"
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                      >
                        <span className="text-xl">→</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpenIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mb-2">
                      No resources shared
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                      Share educational resources!
                    </p>
                    <Link
                      href="/resources/share"
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Share Resource
                    </Link>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link
                  href="/resources"
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                >
                  View all resources →
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Quick Actions
                </h2>
                <span className="text-indigo-500">⚡</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/posts/create"
                  className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-all"
                >
                  <NewspaperIcon className="h-6 w-6 text-purple-600 dark:text-purple-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    New Post
                  </span>
                </Link>

                <Link
                  href="/events"
                  className="flex flex-col items-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all"
                >
                  <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Events
                  </span>
                </Link>

                <Link
                  href="/connections"
                  className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30 transition-all"
                >
                  <UserGroupIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Connect
                  </span>
                </Link>

                <Link
                  href="/jobs"
                  className="flex flex-col items-center p-3 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-all"
                >
                  <BriefcaseIcon className="h-6 w-6 text-amber-600 dark:text-amber-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Jobs
                  </span>
                </Link>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
