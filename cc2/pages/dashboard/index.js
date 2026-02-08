import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import UserNotifications from "../../components/UserNotifications";
import TrendingSection from "../../components/TrendingSection";
import FloatingActionButton from "../../components/FloatingActionButton";
import {
  CalendarIcon,
  BriefcaseIcon,
  UserGroupIcon,
  BookOpenIcon,
  AcademicCapIcon,
  BookmarkIcon,
  FireIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const redirecting = useRef(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [recentBookmarks, setRecentBookmarks] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);

  useEffect(() => {
    if (status === "unauthenticated" && !redirecting.current) {
      redirecting.current = true;
      router.replace("/login");
    } else if (status === "authenticated" && session?.user) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 30000);
      const onVisible = () => {
        if (!document.hidden) fetchDashboardData();
      };
      document.addEventListener("visibilitychange", onVisible);
      return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, requestsRes, bookmarksRes] = await Promise.all([
        fetch(`/api/dashboard/stats?_t=${Date.now()}`, {
          cache: "no-cache",
          headers: { "Cache-Control": "no-cache" },
        }),
        fetch("/api/communities/requests/pending"),
        fetch("/api/bookmarks?limit=3"),
      ]);

      const statsData = await statsRes.json();
      if (statsRes.ok && statsData.data) {
        setStats(statsData.data);
      }

      const requestsData = await requestsRes.json();
      setPendingRequests(
        requestsRes.ok && requestsData.requests ? requestsData.requests : [],
      );

      const bookmarksData = await bookmarksRes.json();
      setRecentBookmarks(
        bookmarksRes.ok && bookmarksData.bookmarks
          ? bookmarksData.bookmarks
          : [],
      );

      if (session?.user?.role === "student") {
        const quizRes = await fetch("/api/quiz/history");
        const quizData = await quizRes.json();
        setQuizHistory(
          quizRes.ok && quizData.history ? quizData.history.slice(0, 3) : [],
        );
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const handleApprove = async (communityId, requesterId) => {
    try {
      const res = await fetch(`/api/communities/${communityId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      });
      if (res.ok) fetchDashboardData();
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleDecline = async (communityId, requesterId) => {
    try {
      const res = await fetch(`/api/communities/${communityId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      });
      if (res.ok) fetchDashboardData();
    } catch (error) {
      console.error("Error declining request:", error);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const role = session?.user?.role;
  const joinedEvents = (stats.joinedEvents || []).slice(0, 3);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome, {session?.user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Your dashboard overview
          </p>
        </div>
        <Link href="/profile">
          <Image
            src={session?.user?.image || "/default-avatar.png"}
            alt="Profile"
            width={40}
            height={40}
            className="rounded-full ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-indigo-400 transition-all"
          />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={<UserGroupIcon className="h-5 w-5" />}
          label="Connections"
          value={stats.connections}
          href="/connections"
          color="blue"
        />
        <StatCard
          icon={<CalendarIcon className="h-5 w-5" />}
          label="Events"
          value={stats.events}
          href="/events"
          color="purple"
        />
        <StatCard
          icon={<BookOpenIcon className="h-5 w-5" />}
          label="Resources"
          value={stats.resources}
          href="/resources"
          color="emerald"
        />
        <StatCard
          icon={<BookmarkIcon className="h-5 w-5" />}
          label="Bookmarks"
          value={stats.bookmarks}
          href="/bookmarks"
          color="yellow"
        />
        {role === "faculty" || role === "admin" ? (
          <StatCard
            icon={<BriefcaseIcon className="h-5 w-5" />}
            label="Jobs"
            value={stats.jobs}
            href="/jobs"
            color="orange"
          />
        ) : (
          <StatCard
            icon={<AcademicCapIcon className="h-5 w-5" />}
            label="Quizzes"
            value={stats.quizzes?.submissions || 0}
            href="/quiz"
            color="orange"
          />
        )}
      </div>

      {/* Faculty Quiz Row */}
      {(role === "faculty" || role === "admin") &&
        (stats.quizzes?.totalQuizzes > 0 || stats.quizzes?.activeQuizzes > 0) && (
          <div className="flex gap-3">
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <AcademicCapIcon className="h-5 w-5 text-indigo-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.quizzes.totalQuizzes}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  My Quizzes
                </p>
              </div>
            </div>
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stats.quizzes.activeQuizzes}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Active Now
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Student Quiz Summary */}
      {role === "student" && stats.quizzes?.submissions > 0 && (
        <div className="flex gap-3">
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
            <AcademicCapIcon className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.quizzes.submissions}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Quizzes Taken
              </p>
            </div>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats.quizzes.averageScore}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Avg Score
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-3">
            Pending Approvals ({pendingRequests.length})
          </h2>
          <div className="space-y-2">
            {pendingRequests.slice(0, 3).map((req) => (
              <div
                key={`${req.communityId}-${req.requester.id}`}
                className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Image
                    src={req.requester.image || "/default-avatar.png"}
                    alt={req.requester.name}
                    width={32}
                    height={32}
                    className="rounded-full flex-shrink-0"
                  />
                  <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    <span className="font-medium">{req.requester.name}</span>
                    {" wants to join "}
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {req.communityName}
                    </span>
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 ml-2">
                  <button
                    onClick={() =>
                      handleApprove(req.communityId, req.requester.id)
                    }
                    className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleDecline(req.communityId, req.requester.id)
                    }
                    className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* My Events */}
          <Card title="My Events" icon={<CalendarIcon className="h-4 w-4 text-gray-400" />} href="/events">
            {joinedEvents.length > 0 ? (
              <div className="space-y-3">
                {joinedEvents.map((event) => (
                  <div key={event._id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(event.date)}
                        {event.location && ` \u00B7 ${event.location}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No events joined yet" actionText="Browse Events" href="/events" />
            )}
          </Card>

          {/* Student Quiz History */}
          {role === "student" && (
            <Card title="Recent Quizzes" icon={<AcademicCapIcon className="h-4 w-4 text-gray-400" />} href="/quiz">
              {quizHistory.length > 0 ? (
                <div className="space-y-3">
                  {quizHistory.map((entry, idx) => (
                    <div key={entry._id || idx} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {entry.quizName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(entry.submission?.submittedAt || entry.endedAt)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 flex-shrink-0 ml-3">
                        {entry.submission?.percentage?.toFixed(0) || 0}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState text="No quizzes taken yet" actionText="Browse Quizzes" href="/quiz" />
              )}
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notifications */}
          <UserNotifications />

          {/* Bookmarks */}
          <Card title="Bookmarks" icon={<BookmarkIcon className="h-4 w-4 text-gray-400" />} href="/bookmarks">
            {recentBookmarks.length > 0 ? (
              <div className="space-y-3">
                {recentBookmarks.map((bookmark) => (
                  <div key={bookmark._id} className="flex items-center gap-3">
                    <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex-shrink-0">
                      {bookmark.type}
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {bookmark.item?.title ||
                        bookmark.item?.quizName ||
                        bookmark.item?.content?.substring(0, 50) ||
                        bookmark.title ||
                        "Untitled"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No bookmarks yet" />
            )}
          </Card>

          {/* Trending */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <FireIcon className="h-4 w-4 text-orange-500" />
              Trending
            </h3>
            <TrendingSection type="all" limit={5} />
          </div>
        </div>
      </div>

      <FloatingActionButton position="bottom-right" />
    </div>
  );
}

// Reusable stat card
function StatCard({ icon, label, value, href, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    yellow: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
  };

  return (
    <Link
      href={href}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
    >
      <div className={`inline-flex p-2 rounded-lg mb-2 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </Link>
  );
}

// Reusable content card
function Card({ title, icon, href, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {href && (
          <Link
            href={href}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            View all
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

// Reusable empty state
function EmptyState({ text, actionText, href }) {
  return (
    <div className="text-center py-6">
      <p className="text-sm text-gray-400 dark:text-gray-500">{text}</p>
      {actionText && href && (
        <Link
          href={href}
          className="inline-block mt-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}
