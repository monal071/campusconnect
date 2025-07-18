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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900">
      <NavBar isLoggedIn={isLoggedIn} isGuest={isGuest} />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full"
      >
        <div className="space-y-6">{children}</div>
      </motion.main>
    </div>
  );
};

export default Layout;