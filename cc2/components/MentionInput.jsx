import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

export default function MentionInput({ value, onChange, placeholder = 'Write something...' }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch user suggestions
  const fetchSuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching user suggestions:', error);
    }
  };

  // Handle text change
  const handleChange = (e) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(position);

    // Check if @ is typed
    const textBeforeCursor = newValue.substring(0, position);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const hasSpace = textAfterAt.includes(' ');
      
      if (!hasSpace) {
        setMentionQuery(textAfterAt);
        setShowSuggestions(true);
        setSelectedIndex(0);
        fetchSuggestions(textAfterAt);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle mention selection
  const selectMention = (user) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    const newValue = 
      value.substring(0, lastAtIndex) + 
      `@${user.name} ` + 
      textAfterCursor;
    
    onChange(newValue);
    setShowSuggestions(false);
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
      const newPosition = lastAtIndex + user.name.length + 2;
      setTimeout(() => {
        inputRef.current.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        if (showSuggestions) {
          e.preventDefault();
          selectMention(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  // Parse content to highlight mentions and hashtags
  const parseContent = (text) => {
    if (!text) return '';
    
    // Mention regex: @Username
    const mentionRegex = /@(\w+)/g;
    // Hashtag regex: #tag
    const hashtagRegex = /#(\w+)/g;
    
    let parsed = text;
    
    // Replace mentions
    parsed = parsed.replace(mentionRegex, (match) => {
      return `<span class="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">${match}</span>`;
    });
    
    // Replace hashtags
    parsed = parsed.replace(hashtagRegex, (match) => {
      return `<span class="text-blue-500 dark:text-blue-300 font-medium cursor-pointer hover:underline">${match}</span>`;
    });
    
    return parsed;
  };

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
        rows={4}
      />

      {/* Mention Suggestions */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50"
          >
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((user, index) => (
                <button
                  key={user._id || user.id}
                  onClick={() => selectMention(user)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    {user.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              Use ↑↓ to navigate, Enter to select, Esc to dismiss
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Text */}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Use <span className="font-semibold text-blue-600 dark:text-blue-400">@username</span> to mention someone
        {' • '}
        Use <span className="font-semibold text-blue-500 dark:text-blue-300">#tag</span> for hashtags
      </p>
    </div>
  );
}

// Utility function to extract mentions from text
export function extractMentions(text) {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
}

// Utility function to extract hashtags from text
export function extractHashtags(text) {
  const hashtagRegex = /#(\w+)/g;
  const hashtags = [];
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }
  
  return [...new Set(hashtags)]; // Remove duplicates
}

// Component to render parsed content with clickable mentions and hashtags
export function ParsedContent({ content, className = '' }) {
  const handleMentionClick = (username) => {
    // Navigate to user profile
    window.location.href = `/profile/${username}`;
  };

  const handleHashtagClick = (tag) => {
    // Navigate to hashtag search
    window.location.href = `/search?tag=${tag}`;
  };

  const parseContent = () => {
    if (!content) return null;
    
    const parts = [];
    let lastIndex = 0;
    
    // Combined regex for mentions and hashtags
    const regex = /(@\w+)|(#\w+)/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Add matched mention or hashtag
      const fullMatch = match[0];
      if (fullMatch.startsWith('@')) {
        const username = fullMatch.substring(1);
        parts.push(
          <button
            key={`mention-${match.index}`}
            onClick={() => handleMentionClick(username)}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          >
            {fullMatch}
          </button>
        );
      } else if (fullMatch.startsWith('#')) {
        const tag = fullMatch.substring(1);
        parts.push(
          <button
            key={`hashtag-${match.index}`}
            onClick={() => handleHashtagClick(tag)}
            className="text-blue-500 dark:text-blue-300 font-medium hover:underline cursor-pointer"
          >
            {fullMatch}
          </button>
        );
      }
      
      lastIndex = match.index + fullMatch.length;
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }
    
    return parts;
  };

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {parseContent()}
    </div>
  );
}
