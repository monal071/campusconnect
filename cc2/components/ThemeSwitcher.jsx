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
      className="ml-2 p-2 bg-gray-200 dark:bg-gray-800 rounded-full shadow hover:scale-110 transition-transform"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      aria-label="Toggle theme"
      type="button"
    >
      {isDark ? (
        <LightMode className="h-5 w-5 text-yellow-500" />
      ) : (
        <DarkMode className="h-5 w-5 text-purple-600" />
      )}
    </motion.button>
  );
}