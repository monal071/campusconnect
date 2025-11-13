import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon, CommandLineIcon } from '@heroicons/react/24/outline';

const SHORTCUTS = [
  { key: '⌘K or Ctrl+K', description: 'Open global search', action: 'search' },
  { key: 'N', description: 'Create new post', action: 'newPost' },
  { key: 'Shift+N', description: 'Create new resource', action: 'newResource' },
  { key: 'Shift+E', description: 'Create new event', action: 'newEvent' },
  { key: 'Shift+Q', description: 'Create new quiz', action: 'newQuiz' },
  { key: 'H', description: 'Go to home/dashboard', action: 'home' },
  { key: 'P', description: 'Go to posts', action: 'posts' },
  { key: 'R', description: 'Go to resources', action: 'resources' },
  { key: 'E', description: 'Go to events', action: 'events' },
  { key: 'Q', description: 'Go to quizzes', action: 'quizzes' },
  { key: 'C', description: 'Open connections', action: 'connections' },
  { key: 'B', description: 'Open bookmarks', action: 'bookmarks' },
  { key: '?', description: 'Show this help', action: 'help' },
  { key: 'Esc', description: 'Close modals/dialogs', action: 'close' },
];

export default function KeyboardShortcuts({ onSearchOpen, onNewPostOpen }) {
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if user is typing in an input/textarea
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) {
        // Allow Ctrl+K / Cmd+K even in inputs
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          if (onSearchOpen) onSearchOpen();
        }
        return;
      }

      // Global shortcuts
      switch (e.key.toLowerCase()) {
        case 'k':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (onSearchOpen) onSearchOpen();
          }
          break;
        case 'n':
          if (e.shiftKey) {
            e.preventDefault();
            router.push('/resources');
          } else {
            e.preventDefault();
            if (onNewPostOpen) onNewPostOpen();
          }
          break;
        case 'e':
          if (e.shiftKey) {
            e.preventDefault();
            router.push('/events');
          } else {
            e.preventDefault();
            router.push('/events');
          }
          break;
        case 'q':
          if (e.shiftKey) {
            e.preventDefault();
            router.push('/quiz');
          } else {
            e.preventDefault();
            router.push('/quiz');
          }
          break;
        case 'h':
          e.preventDefault();
          router.push('/dashboard');
          break;
        case 'p':
          e.preventDefault();
          router.push('/posts');
          break;
        case 'r':
          e.preventDefault();
          router.push('/resources');
          break;
        case 'c':
          e.preventDefault();
          router.push('/connections');
          break;
        case 'b':
          e.preventDefault();
          router.push('/bookmarks');
          break;
        case '?':
          e.preventDefault();
          setShowHelp(true);
          break;
        case 'escape':
          setShowHelp(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [router, onSearchOpen, onNewPostOpen]);

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 z-40 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors lg:hidden"
        title="Keyboard shortcuts"
      >
        <CommandLineIcon className="h-6 w-6" />
      </button>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelp(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CommandLineIcon className="h-6 w-6 text-blue-500" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Keyboard Shortcuts
                  </h2>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-3">
                  {SHORTCUTS.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {shortcut.description}
                      </span>
                      <kbd className="px-3 py-1 text-xs font-semibold text-gray-800 bg-white dark:bg-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    <strong>Tip:</strong> Press <kbd className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded">?</kbd> anytime to see this help
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
