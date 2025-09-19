import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import ThemeSwitcher from "./ThemeSwitcher";
import ConnectModal from "./ConnectModal";
import ChatList from "./ChatList";
import { motion, AnimatePresence } from "framer-motion";

// Icons
import HomeIcon from "@mui/icons-material/Home";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleIcon from "@mui/icons-material/People";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

export default function NavBar() {
  const { data: session, status } = useSession();
  const [isGuest, setIsGuest] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userName, setUserName] = useState("");
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("user");
  const [pendingRequests, setPendingRequests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const menuRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const guest = localStorage.getItem("guest");
      setIsGuest(!!guest);
      if (session?.user) {
        setUserName(session.user.name || "User");
        // Get role from session first, then localStorage as fallback
        const role = session.user.role || localStorage.getItem("role") || "user";
        console.log("NavBar userRole debug:", role, "session role:", session.user.role);
        setUserRole(role);
        
        // Fetch connection requests when logged in
        fetchConnectionRequests();
        fetchUnreadMessages();
      } else {
        setUserName(localStorage.getItem("guestName") || "User");
        setUserRole(localStorage.getItem("role") || "user");
      }
    }
  }, [session]);

  // Fetch connection requests
  const fetchConnectionRequests = async () => {
    try {
      const response = await fetch('/api/connection-requests');
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.receivedRequests.length);
      }
    } catch (error) {
      console.error('Error fetching connection requests:', error);
    }
  };

  // Fetch unread messages count
  const fetchUnreadMessages = async () => {
    try {
      const response = await fetch('/api/chat/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadMessages(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  // Periodically check for new connection requests and messages (every 2 minutes)
  useEffect(() => {
    if (session?.user) {
      const interval = setInterval(() => {
        fetchConnectionRequests();
        fetchUnreadMessages();
      }, 120000); // 2 minutes

      return () => clearInterval(interval);
    }
  }, [session]);  // Listen for login/logout events from other tabs/windows
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
              href="/dashboard" 
              className="nav-link"
            >
              Dashboard
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
              href="/connect" 
              className="nav-link relative"
            >
              Connect
              {pendingRequests > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {pendingRequests}
                </span>
              )}
            </Link>
            
            {/* Chat button - only for authenticated users */}
            {session && (
              <button
                onClick={() => setShowChatList(true)}
                className="nav-link relative flex items-center"
                title="Messages"
              >
                <ChatBubbleOutlineIcon className="w-5 h-5 mr-1" />
                Chat
                {unreadMessages > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>
            )}
            
            <Link 
              href="/posts" 
              className="nav-link"
            >
              Posts
            </Link>
            
            {/* Admin Panel link - only visible to admins */}
            {userRole === 'admin' && (
              <Link 
                href="/admin" 
                className="btn btn-secondary text-sm"
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Right side buttons */}
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          
          {(session || isGuest) ? (
                          <div className="relative flex items-center gap-2">
                {/* Role indicator button */}
                <div className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  userRole === 'admin' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                    : userRole === 'faculty'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </div>
                
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
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 dark:from-indigo-600 dark:to-purple-700 flex items-center justify-center shadow-md">
                      <span className="text-white text-sm font-medium">
                        {userName.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
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
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {session?.user?.email}
                      </p>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          userRole === 'admin' 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                            : userRole === 'faculty'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <Link 
                      href="/home" 
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <div className="flex items-center">
                        <HomeIcon className="h-4 w-4 mr-2" /> Home
                      </div>
                    </Link>
                    
                    <Link 
                      href="/dashboard" 
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <div className="flex items-center">
                        <DashboardIcon className="h-4 w-4 mr-2" /> Dashboard
                      </div>
                    </Link>
                    
                    {userRole === 'admin' && (
                      <Link 
                        href="/admin" 
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <div className="flex items-center">
                          <AdminPanelSettingsIcon className="h-4 w-4 mr-2" /> Admin Panel
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
                      : userRole === 'faculty'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
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
                href="/connect" 
                className="block px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-medium relative"
                onClick={() => setMobileMenuOpen(false)}
              >
                Connect
                {pendingRequests > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {pendingRequests}
                  </span>
                )}
              </Link>
              
              {/* Chat button for mobile - only for authenticated users */}
              {session && (
                <button
                  onClick={() => {
                    setShowChatList(true);
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-medium relative"
                >
                  <div className="flex items-center">
                    <ChatBubbleOutlineIcon className="w-4 h-4 mr-2" />
                    Chat
                    {unreadMessages > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </div>
                </button>
              )}
              
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
      <ChatList 
        isOpen={showChatList} 
        onClose={() => setShowChatList(false)} 
        onUnreadCountChange={(count) => setUnreadMessages(count)}
      />
    </nav>
  );
}
