import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import ThemeSwitcher from "./ThemeSwitcher";
import ConnectModal from "./ConnectModal";
import ChatList from "./ChatList";
import EditProfileModal from "./EditProfileModal";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import HomeIcon from "@mui/icons-material/Home";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleIcon from "@mui/icons-material/People";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import QuizIcon from "@mui/icons-material/Quiz";
import EditIcon from "@mui/icons-material/Edit";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CloseIcon from "@mui/icons-material/Close";

export default function NavBar() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isGuest, setIsGuest] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [userName, setUserName] = useState("");
  const [userImage, setUserImage] = useState("");
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const guest = localStorage.getItem("guest");
      setIsGuest(!!guest);
      if (session?.user) {
        setUserName(session.user.name || "User");
        setUserImage(session.user.image || "");
        // Get role from session first, update localStorage if present
        const role = session.user.role || null;
        if (role) {
          localStorage.setItem("role", role);
        }
        const activeRole = role || localStorage.getItem("role") || null;
        setUserRole(activeRole);

        // Fetch connection requests when logged in
        fetchConnectionRequests();
        fetchUnreadMessages();
        fetchNotifications();
      } else {
        setUserName(localStorage.getItem("guestName") || "User");
        setUserRole(localStorage.getItem("role") || null);
      }
    }
  }, [session]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        const unread = data.notifications.filter((n) => !n.read).length;
        setUnreadNotifications(unread);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      if (response.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Fetch connection requests
  const fetchConnectionRequests = async () => {
    try {
      const response = await fetch("/api/connection-requests");
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.receivedRequests.length);
      }
    } catch (error) {
      console.error("Error fetching connection requests:", error);
    }
  };

  // Fetch unread messages count
  const fetchUnreadMessages = async () => {
    try {
      const response = await fetch("/api/chat/unread-count");
      if (response.ok) {
        const data = await response.json();
        setUnreadMessages(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching unread messages:", error);
    }
  };

  // Periodically check for new connection requests and messages (every 2 minutes)
  useEffect(() => {
    if (session?.user) {
      const interval = setInterval(() => {
        fetchConnectionRequests();
        fetchUnreadMessages();
        fetchNotifications();
      }, 120000); // 2 minutes

      return () => clearInterval(interval);
    }
  }, [session]); // Listen for login/logout events from other tabs/windows
  useEffect(() => {
    const syncAuth = () => {
      const guest = localStorage.getItem("guest");
      setIsGuest(!!guest);
      if (session?.user) {
        setUserName(session.user.name || "User");
      } else {
        setUserName(localStorage.getItem("guestName") || "User");
      }
    };
    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);
  }, [session]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (isGuest) {
      localStorage.removeItem("guest");
      localStorage.removeItem("guestName");
      window.location.href = "/login";
      setTimeout(() => window.location.reload(), 100);
    } else {
      signOut({ callbackUrl: "/login" });
    }
  };

  // Helper function to get notification icon based on type
  const getNotificationIcon = (type) => {
    const iconClass = "w-10 h-10 rounded-full p-2";
    switch (type) {
      case "connection_request":
        return (
          <div className={`${iconClass} bg-blue-100 dark:bg-blue-900/30`}>
            <PeopleIcon className="text-blue-600 dark:text-blue-400" />
          </div>
        );
      case "connection_accepted":
        return (
          <div className={`${iconClass} bg-green-100 dark:bg-green-900/30`}>
            ✓
          </div>
        );
      case "community_request":
        return (
          <div className={`${iconClass} bg-purple-100 dark:bg-purple-900/30`}>
            🌐
          </div>
        );
      case "community_approved":
        return (
          <div className={`${iconClass} bg-green-100 dark:bg-green-900/30`}>
            ✓
          </div>
        );
      case "new_job":
        return (
          <div className={`${iconClass} bg-green-100 dark:bg-green-900/30`}>
            💼
          </div>
        );
      case "new_event":
        return (
          <div className={`${iconClass} bg-blue-100 dark:bg-blue-900/30`}>
            📅
          </div>
        );
      case "new_post":
        return (
          <div className={`${iconClass} bg-purple-100 dark:bg-purple-900/30`}>
            📝
          </div>
        );
      case "message":
        return (
          <div className={`${iconClass} bg-pink-100 dark:bg-pink-900/30`}>
            <ChatBubbleOutlineIcon className="text-pink-600 dark:text-pink-400" />
          </div>
        );
      default:
        return (
          <div className={`${iconClass} bg-gray-100 dark:bg-gray-700`}>
            <NotificationsIcon className="text-gray-600 dark:text-gray-400" />
          </div>
        );
    }
  };

  // Helper function to format notification time
  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo and brand */}
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Link
              href={userRole === "admin" ? "/admin" : "/dashboard"}
              className="flex items-center"
            >
              <Image
                src="/campusconnect-logo.svg"
                alt="CampusConnect Logo"
                width={36}
                height={36}
                className="transition-transform duration-300 hover:rotate-12"
              />
              <span className="ml-2 text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
                CampusConnect
              </span>
            </Link>
          </div>
        </div>

        {/* Desktop navigation links - Hide for admin users */}
        {userRole !== "admin" && (
          <div className="flex items-center space-x-1 lg:space-x-2">
            {[
              { href: "/dashboard", label: "Dashboard" },
              { href: "/events", label: "Events" },
              { href: "/resources", label: "Resources" },
              { href: "/jobs", label: "Jobs" },
              { href: "/communities", label: "Communities" },
              { href: "/connections", label: "Connect", badge: pendingRequests },
            ].map((item) => {
              const isActive =
                router.pathname === item.href ||
                (item.href !== "/dashboard" && router.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 font-semibold"
                      : "text-slate-600 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {item.label}
                  {item.badge > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Quiz link - only for faculty and students */}
            {session &&
              (userRole === "faculty" || userRole === "student") && (
                <Link
                  href="/quiz"
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                    router.pathname.startsWith("/quiz")
                      ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 font-semibold"
                      : "text-slate-600 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                  title="Quiz"
                >
                  <QuizIcon className="w-4 h-4 mr-1" />
                  Quiz
                </Link>
              )}
          </div>
        )}

        {/* Admin Panel indicator */}
        {userRole === "admin" && (
          <div className="hidden md:flex items-center">
            <div className="flex items-center px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AdminPanelSettingsIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <span className="text-red-600 dark:text-red-400 font-semibold">
                Admin Panel
              </span>
            </div>
          </div>
        )}

        {/* Right side buttons */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />

          {/* Notification Bell */}
          {(session || isGuest) && (
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                {unreadNotifications > 0 ? (
                  <NotificationsActiveIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                ) : (
                  <NotificationsIcon className="w-6 h-6" />
                )}
                {unreadNotifications > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <NotificationsActiveIcon className="text-white text-2xl" />
                        <h3 className="text-white font-bold text-lg">
                          Notifications
                        </h3>
                      </div>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
                      >
                        <CloseIcon />
                      </button>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <NotificationsIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400">
                            No notifications yet
                          </p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => {
                              if (!notification.read) {
                                markAsRead(notification._id);
                              }
                            }}
                            className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                              !notification.read
                                ? "bg-indigo-50 dark:bg-indigo-900/20"
                                : ""
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  {formatNotificationTime(
                                    notification.createdAt,
                                  )}
                                </p>
                              </div>
                              {!notification.read && (
                                <div className="flex-shrink-0 w-2 h-2 bg-indigo-600 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 text-center">
                        <button
                          onClick={() => {
                            setShowNotifications(false);
                            // Mark all as read
                            notifications
                              .filter((n) => !n.read)
                              .forEach((n) => markAsRead(n._id));
                          }}
                          className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold"
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {session || isGuest ? (
            <div className="relative flex items-center gap-2">
              {/* Role indicator button - only show if user has a valid role */}
              {userRole && (
                <div
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    userRole === "admin"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      : userRole === "faculty"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}
                >
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </div>
              )}

              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 focus:outline-none rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-expanded={showProfileMenu}
                aria-haspopup="true"
              >
                <span className="hidden sm:inline-block text-slate-700 dark:text-slate-200 font-medium">
                  {userName}
                </span>
                <div className="relative">
                  {userImage ? (
                    <Image
                      src={userImage}
                      alt={userName}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-600 dark:to-purple-700 flex items-center justify-center shadow-md">
                      <span className="text-white text-sm font-medium">
                        {userName.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  {showProfileMenu ? (
                    <span className="absolute -right-1 -top-1 block h-3 w-3 rounded-full ring-2 ring-white bg-green-400" />
                  ) : null}
                </div>
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg py-1 border border-slate-200 dark:border-slate-700 z-50"
                  >
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {userName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {session?.user?.email}
                      </p>
                      <div className="mt-1">
                        {userRole && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              userRole === "admin"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                                : userRole === "faculty"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <div className="flex items-center">
                        <DashboardIcon className="h-4 w-4 mr-2" /> Dashboard
                      </div>
                    </Link>

                    <button
                      onClick={() => {
                        setShowEditProfile(true);
                        setShowProfileMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700"
                    >
                      <div className="flex items-center">
                        <EditIcon className="h-4 w-4 mr-2" /> Edit Profile
                      </div>
                    </button>

                    {userRole === "admin" && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <div className="flex items-center">
                          <AdminPanelSettingsIcon className="h-4 w-4 mr-2" />{" "}
                          Admin Panel
                        </div>
                      </Link>
                    )}

                    <div className="border-t border-slate-200 dark:border-slate-700"></div>

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700"
                    >
                      <div className="flex items-center">
                        <LogoutIcon className="h-4 w-4 mr-2" /> Logout
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/signup"
                className="btn btn-outline hover:btn-primary"
              >
                Sign Up
              </Link>
              <Link href="/login" className="btn btn-primary">
                Sign In
              </Link>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className={`${mobileMenuOpen ? "hidden" : "block"} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            <svg
              className={`${mobileMenuOpen ? "block" : "hidden"} h-6 w-6`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-slate-900 shadow-inner border-t border-slate-200 dark:border-slate-800">
              {/* Role indicator for mobile */}
              {(session || isGuest) && (
                <div className="flex items-center justify-between px-3 py-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    {userName}
                  </span>
                  {userRole && (
                    <div
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        userRole === "admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          : userRole === "faculty"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      }`}
                    >
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </div>
                  )}
                </div>
              )}

              {/* Show regular links only for non-admin users */}
              {userRole !== "admin" && (
                <>
                  {[
                    { href: "/dashboard", label: "Dashboard" },
                    { href: "/events", label: "Events" },
                    { href: "/resources", label: "Resources" },
                    { href: "/jobs", label: "Jobs" },
                    { href: "/communities", label: "Communities" },
                    { href: "/connections", label: "Connect", badge: pendingRequests },
                  ].map((item) => {
                    const isActive =
                      router.pathname === item.href ||
                      (item.href !== "/dashboard" && router.pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{item.label}</span>
                        {item.badge > 0 && (
                          <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </>
              )}

              {/* Quiz link for mobile - only for faculty and students */}
              {session &&
                (userRole === "faculty" || userRole === "student") && (
                  <Link
                    href="/quiz"
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      router.pathname.startsWith("/quiz")
                        ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 font-semibold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <QuizIcon className="w-4 h-4 mr-2" />
                    Quiz
                  </Link>
                )}

              {/* Admin Panel link in mobile menu - only visible to admins */}
              {userRole === "admin" && (
                <div className="pt-2">
                  <div className="flex items-center justify-center px-3 py-3 bg-red-100 dark:bg-red-900/30 rounded-md">
                    <AdminPanelSettingsIcon className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      Admin Panel
                    </span>
                  </div>
                </div>
              )}

              {!session && !isGuest && (
                <>
                  <Link
                    href="/signup"
                    className="block px-3 py-2 mt-4 text-center border border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-md font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/login"
                    className="block px-3 py-2 text-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
      <ChatList
        isOpen={showChatList}
        onClose={() => setShowChatList(false)}
        onUnreadCountChange={(count) => setUnreadMessages(count)}
      />
      <EditProfileModal
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        user={{
          name: userName,
          email: session?.user?.email,
          image: userImage,
          role: userRole,
        }}
        onSave={(updatedData) => {
          // Update local state
          setUserName(updatedData.name);
          if (updatedData.image) {
            setUserImage(updatedData.image);
          }
          // Force session update by reloading
          window.location.reload();
        }}
      />
    </nav>
  );
}
