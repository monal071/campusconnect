import React, { useState, useCallback, useMemo } from 'react';
import { 
  ClockIcon, 
  AcademicCapIcon, 
  EyeIcon, 
  TrashIcon, 
  PencilIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

/**
 * Enhanced QuizCard Component
 * 
 * Features:
 * - Better error handling and validation
 * - Improved accessibility
 * - Enhanced UI/UX with better visual feedback
 * - Optimized performance with memoization
 * - Proper loading states
 * - Better responsive design
 * - Debug logging for troubleshooting
 */

// Animation variants for better performance
const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
  hover: { scale: 1.02, transition: { duration: 0.2 } }
};

const buttonVariants = {
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
};

export default function QuizCard({ 
  quiz, 
  userRole, 
  onEdit, 
  onDelete, 
  onViewResults, 
  onTake,
  onEnd,
  onActivate
}) {
  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState(null); // Track which action is loading

  // Debug logging
  console.log('🎯 QuizCard render:', {
    quizName: quiz?.quizName,
    status: quiz?.status,
    isActive: quiz?.isActive,
    userRole
  });

  // Memoized computed values
  const isTeacher = useMemo(() => 
    userRole === 'faculty' || userRole === 'admin', 
    [userRole]
  );
  
  const isStudent = useMemo(() => 
    userRole === 'student', 
    [userRole]
  );

  // Enhanced date formatting with error handling
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'No date set';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Date error';
    }
  }, []);

  // Enhanced status color with more states
  const getStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200';
      case 'ended':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200';
    }
  }, []);

  // Enhanced difficulty colors
  const getDifficultyColor = useCallback((difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'expert':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  }, []);

  // Enhanced quiz status computation
  const quizStatus = useMemo(() => {
    // Validate quiz object
    if (!quiz) return { status: 'unknown', canTake: false, displayText: 'Unknown' };

    const isActive = quiz.isActive !== false; // Default to active unless explicitly false
    const status = isActive ? 'active' : 'ended';
    
    return {
      status,
      isActive,
      canTake: isActive && !isTeacher,
      displayText: status === 'active' ? 'Active' : 'Ended',
      color: getStatusColor(status)
    };
  }, [quiz, isTeacher, getStatusColor]);

  // Enhanced error handling for async operations
  const handleAsyncOperation = async (operation, operationType) => {
    if (isLoading) return; // Prevent multiple simultaneous operations

    setIsLoading(true);
    setActionType(operationType);
    
    try {
      await operation();
      console.log(`✅ ${operationType} completed successfully`);
    } catch (error) {
      console.error(`❌ ${operationType} failed:`, error);
      toast.error(`Failed to ${operationType.toLowerCase()}: ${error.message}`);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  // Enhanced end quiz handler
  const handleEndQuiz = useCallback(async () => {
    if (!quiz?._id) {
      toast.error('Quiz ID not found');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to end "${quiz.quizName}"?\n\nStudents will no longer be able to take this quiz.`
    );
    
    if (!confirmed) return;

    await handleAsyncOperation(async () => {
      if (!onEnd) throw new Error('End quiz handler not provided');
      await onEnd(quiz._id);
      toast.success(`Quiz "${quiz.quizName}" ended successfully`);
    }, 'End Quiz');
  }, [quiz, onEnd]);

  // Enhanced activate quiz handler
  const handleActivateQuiz = useCallback(async () => {
    if (!quiz?._id) {
      toast.error('Quiz ID not found');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to reactivate "${quiz.quizName}"?\n\nStudents will be able to take this quiz again.`
    );
    
    if (!confirmed) return;

    await handleAsyncOperation(async () => {
      if (!onActivate) throw new Error('Activate quiz handler not provided');
      await onActivate(quiz._id);
      toast.success(`Quiz "${quiz.quizName}" activated successfully`);
    }, 'Activate Quiz');
  }, [quiz, onActivate]);

  // Enhanced delete handler
  const handleDelete = useCallback(async () => {
    if (!quiz?._id) {
      toast.error('Quiz ID not found');
      return;
    }

    const confirmed = confirm(
      `⚠️ DANGER: Delete "${quiz.quizName}"?\n\nThis action cannot be undone. All quiz data and submissions will be permanently lost.`
    );
    
    if (!confirmed) return;

    await handleAsyncOperation(async () => {
      if (!onDelete) throw new Error('Delete handler not provided');
      await onDelete(quiz._id);
      toast.success(`Quiz "${quiz.quizName}" deleted successfully`);
    }, 'Delete Quiz');
  }, [quiz, onDelete]);

  // Enhanced take quiz handler
  const handleTakeQuiz = useCallback(() => {
    if (!quiz) {
      toast.error('Quiz data not available');
      return;
    }

    if (!quizStatus.canTake) {
      toast.error('This quiz is not available for taking');
      return;
    }

    if (!onTake) {
      toast.error('Take quiz handler not available');
      return;
    }

    console.log('🎯 Taking quiz:', quiz.quizName);
    onTake(quiz);
  }, [quiz, quizStatus.canTake, onTake]);

  // Loading spinner component
  const LoadingSpinner = () => (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );

  // Validate required props
  if (!quiz) {
    return (
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-xl p-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 dark:text-red-300">Quiz data not available</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover="hover"
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {quiz.quizName || 'Untitled Quiz'}
            </h3>
            {quiz.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                {quiz.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${quizStatus.color}`}>
              {quizStatus.displayText}
            </span>
            
            {!quiz.isPublic && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border border-yellow-200">
                <LockClosedIcon className="h-3 w-3 mr-1" />
                Private
              </span>
            )}
            
            {isTeacher && quiz.password && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-200 max-w-24 truncate">
                🔑 {quiz.password}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quiz.difficulty && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
              {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
            </span>
          )}
          
          {quiz.category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {quiz.category}
            </span>
          )}
          
          {quiz.isPublic && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Public
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-center text-indigo-500 mb-1">
              <AcademicCapIcon className="h-5 w-5" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{quiz.totalQuestions || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Questions</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-center text-blue-500 mb-1">
              <ClockIcon className="h-5 w-5" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{quiz.timeLimit || 0}m</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Time Limit</p>
          </div>
          
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-center text-purple-500 mb-1">
              <ChartBarIcon className="h-5 w-5" />
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{quiz.totalPoints || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
          </div>
        </div>
      </div>

      {/* Teacher-only Stats */}
      {isTeacher && quiz.statistics && (
        <div className="px-6 pb-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-indigo-900 dark:text-indigo-200 mb-3 flex items-center">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Quiz Statistics
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {quiz.statistics.submissions || 0}
                </p>
                <p className="text-indigo-700 dark:text-indigo-300">Submissions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(quiz.statistics.averageScore || 0)}%
                </p>
                <p className="text-indigo-700 dark:text-indigo-300">Avg Score</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(quiz.statistics.completionRate || 0)}%
                </p>
                <p className="text-indigo-700 dark:text-indigo-300">Completion</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center flex-wrap gap-2">
          {isTeacher ? (
            <div className="flex space-x-2 flex-wrap">
              {/* View Results Button */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => onViewResults?.(quiz)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Results
              </motion.button>
              
              {/* Edit Button */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => onEdit?.(quiz)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </motion.button>
              
              {/* Quiz Control Buttons */}
              {quizStatus.status === 'active' ? (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleEndQuiz}
                  disabled={isLoading && actionType === 'End Quiz'}
                  className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-all disabled:cursor-not-allowed"
                >
                  {isLoading && actionType === 'End Quiz' ? (
                    <LoadingSpinner />
                  ) : (
                    <StopIcon className="h-4 w-4 mr-2" />
                  )}
                  End Quiz
                </motion.button>
              ) : (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleActivateQuiz}
                  disabled={isLoading && actionType === 'Activate Quiz'}
                  className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-md transition-all disabled:cursor-not-allowed"
                >
                  {isLoading && actionType === 'Activate Quiz' ? (
                    <LoadingSpinner />
                  ) : (
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                  )}
                  Activate Quiz
                </motion.button>
              )}
            </div>
          ) : (
            <div className="flex-1">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleTakeQuiz}
                disabled={!quizStatus.canTake}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-all disabled:cursor-not-allowed w-full justify-center"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                {quizStatus.canTake ? 'Take Quiz' : 'Quiz Not Available'}
              </motion.button>
            </div>
          )}

          {/* Delete Button (Teachers Only) */}
          {isTeacher && (
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={handleDelete}
              disabled={isLoading && actionType === 'Delete Quiz'}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all disabled:opacity-50"
            >
              {isLoading && actionType === 'Delete Quiz' ? (
                <LoadingSpinner />
              ) : (
                <TrashIcon className="h-4 w-4 mr-2" />
              )}
              Delete
            </motion.button>
          )}
        </div>

        {/* Quiz Info for Students */}
        {!isTeacher && (
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              {quiz.createdByName && (
                <span>Created by {quiz.createdByName}</span>
              )}
              {quiz.createdAt && (
                <span>{formatDate(quiz.createdAt)}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}