import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Squares2X2Icon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import ThemeSwitcher from "./ThemeSwitcher";
import ConnectModal from "./ConnectModal";

export default function NavBar() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isGuest, setIsGuest] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [userName, setUserName] = useState("");
  const [showConnectModal, setShowConnectModal] = useState(false);

  const navigationItems = [
    { href: "/home", label: "Home", icon: HomeIcon },
    { href: "/dashboard", label: "Dashboard", icon: Squares2X2Icon },
    { href: "/events", label: "Events", icon: CalendarDaysIcon },
    { href: "/resources", label: "Resources", icon: BookOpenIcon },
    { href: "/jobs", label: "Jobs", icon: BriefcaseIcon },
    { href: "/posts", label: "Posts", icon: ChatBubbleLeftRightIcon },
    { href: "/connections", label: "Connect", icon: UserGroupIcon },
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const guest = localStorage.getItem("guest");
      setIsGuest(!!guest);
      if (session?.user) {
        setUserName(session.user.name || "User");
      } else {
        setUserName(localStorage.getItem("guestName") || "User");
      }
    }
  }, [session]);

  // Listen for login/logout events from other tabs/windows
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

  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
    setShowProfileMenu(false);
  }, [router.pathname]);

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

  const isActivePage = (href) => {
    if (href === "/home" && router.pathname === "/") return true;
    return router.pathname === href || router.pathname.startsWith(href + "/");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/" className="flex items-center space-x-3">
                <div className="relative">
                  <Image
                    src="/campusconnect-logo.svg"
                    alt="CampusConnect Logo"
                    width={40}
                    height={40}
                    className="drop-shadow-sm"
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                  CampusConnect
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePage(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div
                      className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium text-sm">{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-xl -z-10"
                          initial={false}
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Connect Button - Desktop */}
              <div className="hidden md:block">
                <motion.button
                  onClick={() => setShowConnectModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Connect</span>
                </motion.button>
              </div>

              {/* Theme Switcher */}
              <ThemeSwitcher />

              {/* User Menu */}
              {session || isGuest ? (
                <div className="relative">
                  <motion.button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-gray-200 dark:border-gray-700"
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                    )}
                    <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {userName}
                    </span>
                  </motion.button>

                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {showProfileMenu && (
                      <>
                        <motion.div
                          className="fixed inset-0 z-40"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowProfileMenu(false)}
                        />
                        <motion.div
                          className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {userName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {session?.user?.email || "Guest User"}
                            </p>
                          </div>
                          <Link
                            href="/dashboard"
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Squares2X2Icon className="h-5 w-5" />
                            <span>Dashboard</span>
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                            <span>Sign Out</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <motion.button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showMobileMenu ? (
                  <XMarkIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Bars3Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              className="lg:hidden border-t border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-4 py-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isActivePage(item.href);
                    return (
                      <Link key={item.href} href={item.href}>
                        <motion.div
                          className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            isActive
                              ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          }`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{item.label}</span>
                        </motion.div>
                      </Link>
                    );
                  })}

                  {/* Mobile Connect Button */}
                  <motion.button
                    onClick={() => setShowConnectModal(true)}
                    className="flex items-center space-x-3 w-full px-4 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <PlusIcon className="h-5 w-5" />
                    <span>Connect</span>
                  </motion.button>

                  {/* Mobile Auth Links */}
                  {!(session || isGuest) && (
                    <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link
                        href="/login"
                        className="block px-4 py-3 text-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="block px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center rounded-xl font-semibold"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Connect Modal */}
      <ConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
    </>
  );
}
