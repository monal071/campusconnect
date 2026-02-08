import Image from "next/image";
import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import Notification from "./Notification";
import GlobalSearch from "./GlobalSearch";
import ChatList from "./ChatList";
import EditProfileModal from "./EditProfileModal";
import {
  Squares2X2Icon,
  CalendarIcon,
  UsersIcon,
  UserGroupIcon,
  BriefcaseIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  ShieldCheckIcon,
  ChatBubbleLeftIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

const Header = () => {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const { data: session } = useSession();
  const profileRef = useRef(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [router.pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileOpen]);

  // Fetch unread chat count
  useEffect(() => {
    if (!session) return;
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/chat/unread-count");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [session]);

  const handleUnreadCountChange = useCallback((count) => {
    setUnreadCount(count);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    signOut({ callbackUrl: "/login" });
  };

  const handleEditProfile = () => {
    setProfileOpen(false);
    setEditProfileOpen(true);
  };

  const userRole = session?.user?.role;
  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image;
  const userInitial = userName.charAt(0).toUpperCase();

  const navigationItems = [
    { href: "/dashboard", Icon: Squares2X2Icon, text: "Dashboard" },
    { href: "/events", Icon: CalendarIcon, text: "Events" },
    { href: "/quiz", Icon: AcademicCapIcon, text: "Quiz" },
    { href: "/connect", Icon: UsersIcon, text: "Connect" },
    { href: "/communities", Icon: UserGroupIcon, text: "Communities" },
    { href: "/jobs", Icon: BriefcaseIcon, text: "Jobs" },
    { href: "/resources", Icon: BookOpenIcon, text: "Resources" },
  ];

  if (userRole === "admin") {
    navigationItems.push({
      href: "/admin",
      Icon: ShieldCheckIcon,
      text: "Admin",
    });
  }

  const isActive = (href) => router.pathname === href;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/campusconnect-logo.svg"
                alt="CampusConnect"
                width={32}
                height={32}
                className="rounded-lg"
                priority
              />
              <span className="text-lg font-bold text-gray-900 dark:text-white hidden sm:block">
                CampusConnect
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                  }`}
                >
                  <item.Icon className="h-4 w-4" />
                  <span>{item.text}</span>
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-1.5">
              {/* Desktop search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Search...</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded text-gray-400">
                  Ctrl+K
                </kbd>
              </button>

              {/* Mobile search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>

              {/* Chat button */}
              {session && (
                <button
                  onClick={() => setChatOpen(true)}
                  className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                >
                  <ChatBubbleLeftIcon className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* Notifications */}
              <Notification />

              {/* Theme toggle */}
              {mounted && (
                <button
                  onClick={() =>
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                  }
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                >
                  {resolvedTheme === "dark" ? (
                    <SunIcon className="h-5 w-5" />
                  ) : (
                    <MoonIcon className="h-5 w-5" />
                  )}
                </button>
              )}

              {/* Profile avatar + dropdown */}
              {session && (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                  >
                    {userImage ? (
                      <Image
                        src={userImage}
                        alt={userName}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-8 h-8 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-semibold rounded-full">
                        {userInitial}
                      </span>
                    )}
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                      {/* User info */}
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {userName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {userEmail}
                        </p>
                        {userRole && (
                          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 capitalize">
                            <AcademicCapIcon className="h-3 w-3" />
                            {userRole}
                          </span>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="py-1">
                        <button
                          onClick={handleEditProfile}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <UserCircleIcon className="h-4 w-4" />
                          Edit Profile
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-5 w-5" />
                ) : (
                  <Bars3Icon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <nav className="lg:hidden py-3 border-t border-gray-200 dark:border-gray-800 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                  }`}
                >
                  <item.Icon className="h-5 w-5" />
                  <span>{item.text}</span>
                </Link>
              ))}
              {/* Mobile-only: chat and profile links */}
              {session && (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setChatOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <ChatBubbleLeftIcon className="h-5 w-5" />
                    <span>Messages</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setEditProfileOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <UserCircleIcon className="h-5 w-5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </nav>
          )}
        </div>

        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </header>

      {/* Chat modal */}
      <ChatList
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onUnreadCountChange={handleUnreadCountChange}
      />

      {/* Edit profile modal */}
      <EditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        user={session?.user}
        onSave={() => setEditProfileOpen(false)}
      />
    </>
  );
};

export default Header;
