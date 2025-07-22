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
  const [userRole, setUserRole] = useState("user");
  const menuRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const guest = localStorage.getItem("guest");
      setIsGuest(!!guest);
      if (session?.user) {
        setUserName(session.user.name || "User");
        // Get role from session first, then localStorage as fallback
        const role = session.user.role || localStorage.getItem("role") || "user";
        setUserRole(role);
        
        // No longer forcing admins to stay on admin pages
        // They can freely navigate the site
      } else {
        setUserName(localStorage.getItem("guestName") || "User");
        setUserRole(localStorage.getItem("role") || "user");
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
    <nav className="navbar">
      <div className="navbar-container">
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
              className="nav-link"
            >
              Home
            </Link>
            <Link 
              href="/events" 
              className="nav-link"
            >
              Events
            </Link>
            <Link 
              href="/resources" 
              className="nav-link"
            >
              Resources
            </Link>
            <Link 
              href="/jobs" 
              className="nav-link"
            >
              Jobs
            </Link>
            <Link 
              href="/posts" 
              className="nav-link"
            >
              Posts
            </Link>
            <Link 
              href="/connections" 
              className="btn btn-primary"
            >
              Connect
            </Link>
            
            {/* Admin Panel link - only visible to admins */}
            {userRole === 'admin' && (
              <Link 
                href="/admin" 
                className="btn btn-secondary"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          
          {(session || isGuest) ? (
                          <div className="relative flex items-center gap-2">
                {/* Role indicator button */}
                <div className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  userRole === 'admin' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {userRole === 'admin' ? 'Admin' : 'User'}
                </div>
                
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <span className="hidden sm:inline-block text-slate-700 dark:text-slate-200">
                    {userName}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center">
                    <span className="text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                      {userName.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                </button>
              
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg py-1 border border-slate-200 dark:border-slate-700 z-50"
                  >
                    <Link 
                      href="/dashboard" 
                      className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Dashboard
                    </Link>
                    {userRole === 'admin' && (
                      <Link 
                        href="/admin" 
                        className="block px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <div className="px-4 py-2 text-slate-500 dark:text-slate-400 border-t border-b border-slate-100 dark:border-slate-700 text-sm">
                      {userName} {userRole === 'admin' && <span className="badge badge-sm badge-primary">Admin</span>}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700"
                    >
                      Logout
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
              <Link 
                href="/login" 
                className="btn btn-primary"
              >
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
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-slate-900 shadow-inner border-t border-slate-200 dark:border-slate-800">
              {/* Role indicator for mobile */}
              {(session || isGuest) && (
                <div className="flex items-center justify-between px-3 py-2 mb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-700 dark:text-slate-200 font-medium">
                    {userName}
                  </span>
                  <div className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    userRole === 'admin' 
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {userRole === 'admin' ? 'Admin' : 'User'}
                  </div>
                </div>
              )}
              
              <Link 
                href="/home" 
                className="block px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/events" 
                className="block px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Events
              </Link>
              <Link 
                href="/resources" 
                className="block px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Resources
              </Link>
              <Link 
                href="/jobs" 
                className="block px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jobs
              </Link>
              <Link 
                href="/posts" 
                className="block px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-medium"
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
              
              {/* Admin Panel link in mobile menu - only visible to admins */}
              {userRole === 'admin' && (
                <Link 
                  href="/admin" 
                  className="block px-3 py-2 mt-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
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
      
      <ConnectModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} />
    </nav>
  );
}
