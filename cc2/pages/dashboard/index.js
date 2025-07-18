import Head from "next/head";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ClockIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  BellIcon,
  TrendingUpIcon,
  SparklesIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const { data: session, update } = useSession();
  const [connections, setConnections] = useState([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
    }
  }, [session]);

  useEffect(() => {
    async function fetchConnections() {
      setLoading(true);
      try {
        const res = await fetch("/api/connections/users");
        if (!res.ok) throw new Error("Failed to fetch connections");
        const data = await res.json();
        setConnections(data.connections || []);
      } catch (e) {
        setError("Could not load connections");
      } finally {
        setLoading(false);
      }
    }
    fetchConnections();
  }, []);

  // Fetch a random motivational quote
  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await fetch("https://api.quotable.io/random");
        const data = await res.json();
        setQuote(data.content);
      } catch {
        setQuote("Welcome to your dashboard! Make today amazing.");
      }
    }
    fetchQuote();
  }, []);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNameChange = (e) => setName(e.target.value);

  const saveName = async () => {
    setSaving(true);
    setError("");
    try {
      const userId = session?.user?.id;
      if (!userId) throw new Error("User ID not found");
      const res = await fetch(`/api/users?id=${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to update name");
      if (update) await update();
      setEditing(false);
    } catch (e) {
      setError("Could not update name");
    } finally {
      setSaving(false);
    }
  };

  const quickActions = [
    {
      href: "/events",
      label: "Events",
      icon: CalendarIcon,
      color: "from-purple-500 to-pink-500",
      count: "3 upcoming",
    },
    {
      href: "/resources",
      label: "Resources",
      icon: ChartBarIcon,
      color: "from-green-500 to-emerald-500",
      count: "12 new",
    },
    {
      href: "/jobs",
      label: "Jobs",
      icon: TrendingUpIcon,
      color: "from-yellow-500 to-orange-500",
      count: "5 matches",
    },
    {
      href: "/posts",
      label: "Posts",
      icon: SparklesIcon,
      color: "from-pink-500 to-red-500",
      count: "8 new",
    },
    {
      href: "/connections",
      label: "Connect",
      icon: UserGroupIcon,
      color: "from-blue-500 to-purple-500",
      count: `${connections.length} friends`,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.1,
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <Head>
        <title>Dashboard | CampusConnect</title>
      </Head>

      <motion.div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header Section */}
        <motion.div className="mb-8" variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                Welcome back, {name || "Student"}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Here's what's happening in your campus community today
              </p>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                  {time.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {time.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
              <ClockIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          {/* Motivational Quote */}
          <motion.div
            className="card p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <SparklesIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Daily Inspiration
                </h3>
                <p className="text-gray-700 dark:text-gray-300 italic">
                  "{quote}"
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Card */}
          <motion.div className="lg:col-span-1" variants={itemVariants}>
            <div className="card p-6 text-center">
              <div className="relative inline-block mb-4">
                <img
                  src={session.user.image || "/default-profile.png"}
                  alt="Profile"
                  className="w-24 h-24 rounded-full border-4 border-blue-200 dark:border-blue-800 shadow-lg mx-auto"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>

              <div className="space-y-4">
                {editing ? (
                  <div className="space-y-3">
                    <input
                      className="input-field w-full text-center"
                      value={name}
                      onChange={handleNameChange}
                      disabled={saving}
                      placeholder="Enter your name"
                    />
                    <div className="flex space-x-2">
                      <button
                        className="btn-primary flex-1 py-2 text-sm"
                        onClick={saveName}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        className="btn-secondary flex-1 py-2 text-sm"
                        onClick={() => {
                          setEditing(false);
                          setName(session.user.name || "");
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                    {error && (
                      <div className="text-red-500 text-sm">{error}</div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {name}
                    </h2>
                    <button
                      className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                      onClick={() => setEditing(true)}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit Name
                    </button>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {loading ? "..." : connections.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Connections
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            className="lg:col-span-3 space-y-8"
            variants={itemVariants}
          >
            {/* Quick Actions Grid */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.a
                      key={action.href}
                      href={action.href}
                      className="group"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="card p-4 hover:shadow-xl transition-all duration-300 group-hover:border-blue-300 dark:group-hover:border-blue-600">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} p-3 mb-3 group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                          {action.label}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {action.count}
                        </p>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Upcoming Events */}
              <motion.div variants={itemVariants}>
                <UpcomingEvents />
              </motion.div>

              {/* Campus News */}
              <motion.div variants={itemVariants}>
                <div className="card p-6 h-full">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <BellIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Campus News
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        title: "Tech Talk this Friday!",
                        tag: "Event",
                        color: "blue",
                      },
                      {
                        title: "Job fair registrations open",
                        tag: "Career",
                        color: "green",
                      },
                      {
                        title: "New study materials available",
                        tag: "Resources",
                        color: "purple",
                      },
                      {
                        title: "Connect with new students",
                        tag: "Social",
                        color: "pink",
                      },
                    ].map((news, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      >
                        <div
                          className={`w-2 h-2 rounded-full bg-${news.color}-500`}
                        ></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {news.title}
                          </p>
                          <span
                            className={`text-xs text-${news.color}-600 dark:text-${news.color}-400 font-medium`}
                          >
                            {news.tag}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div
          className="text-center text-gray-500 dark:text-gray-400 text-sm mt-12 pt-8 border-t border-gray-200 dark:border-gray-700"
          variants={itemVariants}
        >
          © {new Date().getFullYear()} CampusConnect. Built for students, by
          students.
        </motion.div>
      </motion.div>
    </div>
  );
}

function UpcomingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Failed to fetch events");
      const data = await res.json();
      // Filter for upcoming events (date in future)
      const now = new Date();
      const upcoming = (data.data || []).filter(
        (ev) => new Date(ev.date) > now,
      );
      // Sort by soonest
      upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(upcoming.slice(0, 4));
    } catch (e) {
      setError("Could not load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return (
    <div className="card p-6 h-full">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
          <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Upcoming Events
        </h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8">
          <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No upcoming events
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <motion.div
              key={event._id}
              className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 hover:shadow-md transition-all cursor-pointer"
              whileHover={{ scale: 1.02 }}
            >
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                {event.title}
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-xs mb-2 line-clamp-2">
                {event.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-purple-600 dark:text-purple-400 text-xs font-medium">
                  {new Date(event.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                  {event.type || "Event"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
