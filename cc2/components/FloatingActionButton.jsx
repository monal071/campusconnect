import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  PhotoIcon,
  DocumentPlusIcon,
  CalendarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

const QUICK_ACTIONS = [
  {
    id: 'post',
    label: 'New Post',
    icon: PencilIcon,
    color: 'bg-blue-500 hover:bg-blue-600',
    action: 'newPost',
  },
  {
    id: 'resource',
    label: 'Add Resource',
    icon: DocumentPlusIcon,
    color: 'bg-green-500 hover:bg-green-600',
    action: 'newResource',
  },
  {
    id: 'event',
    label: 'Create Event',
    icon: CalendarIcon,
    color: 'bg-purple-500 hover:bg-purple-600',
    action: 'newEvent',
  },
  {
    id: 'quiz',
    label: 'Create Quiz',
    icon: AcademicCapIcon,
    color: 'bg-indigo-500 hover:bg-indigo-600',
    action: 'newQuiz',
    roleRequired: ['faculty', 'admin'],
  },
  {
    id: 'job',
    label: 'Post Job',
    icon: BriefcaseIcon,
    color: 'bg-orange-500 hover:bg-orange-600',
    action: 'newJob',
    roleRequired: ['faculty', 'admin'],
  },
];

export default function FloatingActionButton({ 
  onAction, 
  userRole = 'student',
  position = 'bottom-right' // bottom-right, bottom-left, top-right, top-left
}) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleAction = (action) => {
    setIsOpen(false);
    
    if (onAction) {
      onAction(action);
    } else {
      // Default actions
      switch (action) {
        case 'newPost':
          router.push('/posts');
          break;
        case 'newResource':
          router.push('/resources');
          break;
        case 'newEvent':
          router.push('/events');
          break;
        case 'newQuiz':
          router.push('/quiz');
          break;
        case 'newJob':
          router.push('/jobs');
          break;
      }
    }
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const filteredActions = QUICK_ACTIONS.filter(action => {
    if (action.roleRequired) {
      return action.roleRequired.includes(userRole);
    }
    return true;
  });

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      {/* Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-16 right-0 space-y-3 mb-2"
          >
            {filteredActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ 
                  opacity: 0, 
                  x: 20,
                  transition: { delay: (filteredActions.length - index) * 0.05 }
                }}
                onClick={() => handleAction(action.action)}
                className={`flex items-center space-x-3 px-4 py-3 ${action.color} text-white rounded-full shadow-lg transition-colors group`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-sm font-medium whitespace-nowrap">
                  {action.label}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`flex items-center justify-center w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors ${
          isOpen ? 'rotate-45' : ''
        }`}
        style={{ transition: 'transform 0.3s ease-in-out' }}
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6" />
        ) : (
          <PlusIcon className="h-6 w-6" />
        )}
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Compact version with just icon
export function FloatingActionButtonCompact({ 
  onClick, 
  icon: Icon = PlusIcon,
  color = 'bg-blue-500 hover:bg-blue-600',
  position = 'bottom-right'
}) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className={`fixed ${positionClasses[position]} z-40 flex items-center justify-center w-14 h-14 ${color} text-white rounded-full shadow-lg transition-colors`}
    >
      <Icon className="h-6 w-6" />
    </motion.button>
  );
}

// Speed Dial variant (shows all actions at once)
export function SpeedDial({ 
  actions = QUICK_ACTIONS,
  onAction,
  userRole = 'student',
  direction = 'up', // up, down, left, right
  position = 'bottom-right'
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action) => {
    setIsOpen(false);
    if (onAction) onAction(action);
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const directionClasses = {
    up: 'flex-col-reverse',
    down: 'flex-col',
    left: 'flex-row-reverse',
    right: 'flex-row',
  };

  const spacingClasses = {
    up: 'space-y-3',
    down: 'space-y-3',
    left: 'space-x-3',
    right: 'space-x-3',
  };

  const filteredActions = actions.filter(action => {
    if (action.roleRequired) {
      return action.roleRequired.includes(userRole);
    }
    return true;
  });

  return (
    <div className={`fixed ${positionClasses[position]} z-40`}>
      <div className={`flex ${directionClasses[direction]} ${spacingClasses[direction]} items-center`}>
        {/* Actions */}
        <AnimatePresence>
          {isOpen && filteredActions.map((action, index) => (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                transition: { delay: index * 0.05 }
              }}
              exit={{ opacity: 0, scale: 0 }}
              className="group relative"
            >
              <button
                onClick={() => handleAction(action.action)}
                className={`flex items-center justify-center w-12 h-12 ${action.color} text-white rounded-full shadow-lg transition-colors`}
                title={action.label}
              >
                <action.icon className="h-6 w-6" />
              </button>
              {/* Tooltip */}
              <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {action.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Main Button */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex items-center justify-center w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        >
          {isOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <PlusIcon className="h-6 w-6" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
