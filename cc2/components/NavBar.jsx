import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import ThemeSwitcher from "./ThemeSwitcher";
import ConnectModal from "./ConnectModal";
import { motion, AnimatePresence } from "framer-motion";

export default function NavBar() {
  const { data: session, status } = useSession();
  const [isGuest, setIsGuest] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userName, setUserName] = useState("");
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
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

  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/home" className="flex items-center">
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

          {/* Desktop navigation links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-6">
              <Link 
                href="/home" 
                className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                Home
              </Link>
              <Link 
                href="/events" 
                className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                Events
              </Link>
              <Link 
                href="/resources" 
                className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                Resources
              </Link>
              <Link 
                href="/jobs" 
                className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                Jobs
              </Link>
              <Link 
                href="/posts" 
                className="px-3 py-2 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
              >
                Posts
              </Link>
              <Link 
                href="/connections" 
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-medium rounded-lg shadow hover:shadow-md transition-all duration-200"
              >
                Connect
              </Link>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            
            {(session || isGuest) ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline font-medium">{userName}</span>
                </button>
                
                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-gray-700 z-50"
                    >
                      <Link 
                        href="/dashboard" 
                        className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-gray-700"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Dashboard
                      </Link>
                      <div className="px-4 py-2 text-gray-500 dark:text-gray-400 border-t border-b border-gray-100 dark:border-gray-700 text-sm">
                        {userName}
                      </div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700"
                      >
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow hover:shadow-md transition-all duration-200"
              >
                Sign In
              </Link>
            )}
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-800 shadow-inner">
              <Link 
                href="/home" 
                className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/events" 
                className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>
              <Link 
                href="/resources" 
                className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Resources
              </Link>
              <Link 
                href="/jobs" 
                className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jobs
              </Link>
              <Link 
                href="/posts" 
                className="block px-3 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Posts
              </Link>
              <Link 
                href="/connections" 
                className="block px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Connect
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <ConnectModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
    </nav>
  );
}
