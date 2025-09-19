import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DarkMode, LightMode } from '@mui/icons-material';

export default function ThemeSwitcher() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check if user has a theme preference
    const theme = localStorage.getItem('theme');
    if (theme) {
      setIsDark(theme === 'dark');
      document.documentElement.classList.toggle('dark', theme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative ml-2 p-2 bg-gray-200 dark:bg-gray-800 rounded-full shadow-md hover:shadow-lg transition-all duration-200 group"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      type="button"
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 0 : 360 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {isDark ? (
          <LightMode className="h-5 w-5 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
        ) : (
          <DarkMode className="h-5 w-5 text-purple-600 group-hover:text-purple-500 transition-colors" />
        )}
      </motion.div>
      
      {/* Tooltip */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        {isDark ? 'Light mode' : 'Dark mode'}
      </div>
    </motion.button>
  );
}