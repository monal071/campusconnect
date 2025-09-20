import { useState } from 'react';
import { 
  ClockIcon, 
  AcademicCapIcon, 
  EyeIcon, 
  TrashIcon, 
  PencilIcon,
  CalendarIcon,
  UsersIcon,
  ChartBarIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function QuizCard({ 
  quiz, 
  userRole, 
  onEdit, 
  onDelete, 
  onViewResults, 
  onTake 
}) {
  const [isLoading, setIsLoading] = useState(false);

  const isTeacher = userRole === 'faculty' || userRole === 'admin';
  const isStudent = userRole === 'student';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'hard':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/quiz/${quiz._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Quiz deleted successfully');
        onDelete(quiz._id);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete quiz');
      }
    } catch (error) {
      toast.error('Error deleting quiz');
      console.error('Delete error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTakeQuiz = () => {
    if (quiz.isExpired) {
      toast.error('This quiz has expired');
      return;
    }
    if (onTake) {
      onTake(quiz);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
              {quiz.quizName}
            </h3>
            {quiz.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                {quiz.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quiz.status)}`}>
              {quiz.status === 'active' ? 'Active' : 'Expired'} [{quiz.status}|{quiz.isExpired ? 'T' : 'F'}]
            </span>
            {!quiz.isPublic && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                🔒 Password Protected
              </span>
            )}
            {isTeacher && quiz.password && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                Password: {quiz.password}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
            {quiz.difficulty}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {quiz.category}
          </span>
          {quiz.isPublic && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Public
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-400 dark:text-gray-500 mb-1">
              <AcademicCapIcon className="h-4 w-4 mr-1" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{quiz.totalQuestions}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Questions</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-400 dark:text-gray-500 mb-1">
              <ClockIcon className="h-4 w-4 mr-1" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{quiz.timeLimit}m</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Time Limit</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center text-gray-400 dark:text-gray-500 mb-1">
              <ChartBarIcon className="h-4 w-4 mr-1" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{quiz.totalPoints}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
          </div>
          
          {isTeacher && (
            <div className="text-center">
              <div className="flex items-center justify-center text-gray-400 dark:text-gray-500 mb-1">
                <UsersIcon className="h-4 w-4 mr-1" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {quiz.stats?.totalSubmissions || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Submissions</p>
            </div>
          )}
        </div>
      </div>

      {/* Deadline */}
      <div className="px-6 pb-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <span>Deadline: {formatDate(quiz.deadline)}</span>
          {quiz.timeRemaining > 0 && (
            <span className="ml-2 text-orange-600 dark:text-orange-400">
              ({Math.floor(quiz.timeRemaining / 60)}h {quiz.timeRemaining % 60}m remaining)
            </span>
          )}
        </div>
      </div>

      {/* Teacher Stats */}
      {isTeacher && quiz.stats && (
        <div className="px-6 pb-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Average Score:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {quiz.stats.averageScore || 0}%
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Completion:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {quiz.stats.completionRate || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <div className="flex justify-between items-center">
          {isTeacher ? (
            <div className="flex space-x-2">
              <button
                onClick={() => onViewResults(quiz)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChartBarIcon className="h-4 w-4 mr-2" />
                Results
              </button>
              <button
                onClick={() => onEdit(quiz)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </button>
            </div>
          ) : (
            <div className="flex-1">
              <button
                onClick={handleTakeQuiz}
                disabled={quiz.isExpired}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                {quiz.isExpired ? 'Expired' : 'Take Quiz'}
              </button>
            </div>
          )}

          {isTeacher && (
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <TrashIcon className="h-4 w-4 mr-2" />
              )}
              Delete
            </button>
          )}
        </div>

        {/* Created by info for students */}
        {!isTeacher && quiz.createdByName && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Created by {quiz.createdByName}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}