import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import ThemeSwitcher from "./ThemeSwitcher";
import ConnectModal from "./ConnectModal";

export default function NavBar() {
  const { data: session, status } = useSession();
  const [isGuest, setIsGuest] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userName, setUserName] = useState("");
  const [showConnectModal, setShowConnectModal] = useState(false);

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

  return (
    <nav className="sticky top-0 z-50 w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur shadow-lg flex items-center justify-between px-6 py-3">
      <div className="flex items-center gap-3">
        <Image src="/campusconnect-logo.svg" alt="CampusConnect Logo" width={36} height={36} />
        <span className="text-xl font-extrabold text-indigo-900 dark:text-white tracking-tight">CampusConnect</span>
      </div>
      <div className="flex items-center gap-6">
        <Link href="/home" className="font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 transition">Home</Link>
        <Link href="/events" className="font-medium text-gray-700 dark:text-gray-200 hover:text-purple-600 transition">Events</Link>
        <Link href="/resources" className="font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 transition">Resources</Link>
        <Link href="/jobs" className="font-medium text-gray-700 dark:text-gray-200 hover:text-purple-600 transition">Jobs</Link>
        <Link href="/posts" className="font-medium text-gray-700 dark:text-gray-200 hover:text-pink-600 transition">Post</Link>
        <Link href="/connections" className="font-medium text-gray-700 dark:text-gray-200 hover:text-green-600 transition bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform">Connect</Link>
        <button
          className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold shadow transition-transform"
          onClick={() => setShowConnectModal(true)}
        >
          + Connect
        </button>
      </div>
      <div className="flex items-center gap-4 h-12">
        {(session || isGuest) ? (
          <div className="relative flex items-center h-full">
            <button
              onClick={() => setShowProfileMenu((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow hover:scale-105 transition-transform h-12"
              style={{ minWidth: 100 }}
            >
              Profile
            </button>
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700">
                <Link href="/dashboard" className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-xl">Dashboard</Link>
                <div className="px-4 py-2 text-gray-700 dark:text-gray-200 border-t border-b border-gray-100 dark:border-gray-700">{userName}</div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-xl"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/login" className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition">Sign In</Link>
            <Link href="/signup" className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold shadow hover:bg-purple-700 transition">Sign Up</Link>
          </>
        )}
      </div>
      <ThemeSwitcher />
      <ConnectModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
    </nav>
  );
}
