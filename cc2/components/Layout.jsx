import NavBar from './NavBar';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsLoggedIn(!!localStorage.getItem('token'));
      setIsGuest(!!localStorage.getItem('guest'));
    }
  }, []);
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <NavBar isLoggedIn={isLoggedIn} isGuest={isGuest} />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full"
      >
        {children}
      </motion.main>
      <footer className="border-t border-gray-200 dark:border-gray-800 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">CampusConnect</div>
              <span className="text-sm text-gray-500 dark:text-gray-400">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition">About</a>
              <a href="#" className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition">Privacy</a>
              <a href="#" className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition">Terms</a>
              <a href="#" className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;