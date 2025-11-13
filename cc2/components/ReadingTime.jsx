// Reading time estimator utility
const WORDS_PER_MINUTE = 200; // Average reading speed
const SECONDS_PER_IMAGE = 12; // Time to view an image

export function calculateReadingTime(text, imageCount = 0) {
  if (!text) return 0;

  // Remove HTML tags
  const plainText = text.replace(/<[^>]*>/g, '');
  
  // Count words
  const wordCount = plainText.trim().split(/\s+/).length;
  
  // Calculate time in minutes
  const textTime = wordCount / WORDS_PER_MINUTE;
  const imageTime = (imageCount * SECONDS_PER_IMAGE) / 60;
  
  const totalTime = Math.ceil(textTime + imageTime);
  
  return totalTime;
}

export function formatReadingTime(minutes) {
  if (minutes < 1) return 'Less than a minute';
  if (minutes === 1) return '1 minute read';
  return `${minutes} min read`;
}

// React component
import { ClockIcon } from '@heroicons/react/24/outline';

export default function ReadingTime({ content, imageCount = 0, className = '' }) {
  const minutes = calculateReadingTime(content, imageCount);
  const formattedTime = formatReadingTime(minutes);

  return (
    <div className={`flex items-center text-sm text-gray-500 dark:text-gray-400 ${className}`}>
      <ClockIcon className="w-4 h-4 mr-1" />
      <span>{formattedTime}</span>
    </div>
  );
}

// Compact version
export function ReadingTimeCompact({ content, imageCount = 0 }) {
  const minutes = calculateReadingTime(content, imageCount);
  
  return (
    <span className="text-xs text-gray-400">
      {minutes} min
    </span>
  );
}

// Badge version
export function ReadingTimeBadge({ content, imageCount = 0 }) {
  const minutes = calculateReadingTime(content, imageCount);
  const formattedTime = formatReadingTime(minutes);
  
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
      <ClockIcon className="w-3 h-3 mr-1" />
      {formattedTime}
    </span>
  );
}

// With progress indicator
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function ReadingProgress({ content, imageCount = 0 }) {
  const [progress, setProgress] = useState(0);
  const totalMinutes = calculateReadingTime(content, imageCount);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const scrollProgress = (scrolled / documentHeight) * 100;
      setProgress(Math.min(scrollProgress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <motion.div
        className="h-1 bg-gradient-to-r from-blue-500 to-purple-500"
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
      <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-lg text-xs font-medium">
        {Math.round(progress)}% · {totalMinutes} min read
      </div>
    </div>
  );
}

// Article metadata with reading time
export function ArticleMetadata({ 
  author, 
  date, 
  content, 
  imageCount = 0,
  category,
  authorAvatar 
}) {
  const readingTime = formatReadingTime(calculateReadingTime(content, imageCount));

  return (
    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
      {authorAvatar && (
        <img 
          src={authorAvatar} 
          alt={author}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-gray-900 dark:text-white">{author}</span>
        <span>·</span>
        <span>{new Date(date).toLocaleDateString()}</span>
        <span>·</span>
        <div className="flex items-center">
          <ClockIcon className="w-4 h-4 mr-1" />
          {readingTime}
        </div>
        {category && (
          <>
            <span>·</span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
              {category}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// Reading time with word count
export function DetailedReadingTime({ content, imageCount = 0 }) {
  const plainText = content?.replace(/<[^>]*>/g, '') || '';
  const wordCount = plainText.trim().split(/\s+/).length;
  const minutes = calculateReadingTime(content, imageCount);
  
  return (
    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
      <div className="flex items-center">
        <ClockIcon className="w-4 h-4 mr-1" />
        <span>{formatReadingTime(minutes)}</span>
      </div>
      <span>·</span>
      <span>{wordCount} words</span>
      {imageCount > 0 && (
        <>
          <span>·</span>
          <span>{imageCount} {imageCount === 1 ? 'image' : 'images'}</span>
        </>
      )}
    </div>
  );
}
