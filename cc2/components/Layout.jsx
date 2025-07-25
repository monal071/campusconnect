import NavBar from './NavBar';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

const Layout = ({ children }) => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  
  // Pages where we don't show the NavBar or footer
  const noNavBarPages = ['/login', '/signup'];
  const showNavBar = !noNavBarPages.includes(router.pathname);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(!!localStorage.getItem('token'));
      setIsGuest(!!localStorage.getItem('guest'));
    }
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {showNavBar && <NavBar isLoggedIn={isLoggedIn} isGuest={isGuest} />}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 container pt-16"
      >
        {children}
      </motion.main>
      {showNavBar && (
        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 mt-8">
          <div className="container-main py-0">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">CampusConnect</div>
                <span className="text-sm text-slate-500 dark:text-slate-400">© {new Date().getFullYear()}</span>
              </div>
              <div className="flex space-x-6">
                <a href="#" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">About</a>
                <a href="#" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Privacy</a>
                <a href="#" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Terms</a>
                <a href="#" className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;