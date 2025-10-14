import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { 
  ClockIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  TrophyIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import LoadingSpinner from './LoadingSpinner';

export default function QuizHistory({ isOpen, onClose, quiz, userRole }) {
  const { data: session } = useSession();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const isTeacher = session?.user?.role === 'faculty' || session?.user?.role === 'admin';
  const isStudent = session?.user?.role === 'student';

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, quiz]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = '/api/quiz/history';
      if (quiz) {
        // Fetch history for specific quiz
        url += `?quizId=${quiz._id}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setHistory(data.history || []);
      } else {
        throw new Error(data.message || 'Failed to fetch history');
      }
    } catch (error) {
      console.error('Error fetching quiz history:', error);
      toast.error('Failed to load quiz history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimeSpent = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {quiz ? `${quiz.quizName} - History` : 'Quiz History'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : selectedQuiz ? (
            // Detailed view for teachers
            <div>
              <button
                onClick={() => setSelectedQuiz(null)}
                className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to History
              </button>
              
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedQuiz.quizName}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Subject</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedQuiz.subject}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Total Questions</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedQuiz.totalQuestions}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Total Points</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedQuiz.totalPoints}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Average Score</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedQuiz.averageScore}%</p>
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Student Submissions ({selectedQuiz.submissions.length})
              </h4>

              {selectedQuiz.submissions.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No students have submitted this quiz yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedQuiz.submissions.map((submission, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 dark:text-white">
                            {submission.studentName}
                          </h5>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {submission.studentId}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(submission.percentage)}`}>
                            {submission.percentage.toFixed(1)}%
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {submission.score}/{submission.totalScore} points
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Submitted</p>
                          <p className="text-gray-900 dark:text-white">{formatDate(submission.submittedAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Time Spent</p>
                          <p className="text-gray-900 dark:text-white">{formatTimeSpent(submission.timeSpent)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Quiz History
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {isTeacher 
                  ? "You haven't created any completed quizzes yet." 
                  : "You haven't completed any quizzes yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {isStudent && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Your Quiz Results
                  </h3>
                </div>
              )}

              {history.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 ${
                    isTeacher ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''
                  } transition-colors`}
                  onClick={() => isTeacher && setSelectedQuiz(item)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.quizName}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.subject} • Ended {formatDate(item.endedAt)}
                      </p>
                    </div>
                    {isTeacher && (
                      <div className="flex items-center text-gray-400">
                        <UserGroupIcon className="h-5 w-5 mr-1" />
                        <span className="text-sm">{item.submissionCount}</span>
                      </div>
                    )}
                  </div>

                  {isStudent && item.submission && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <TrophyIcon className={`h-6 w-6 mx-auto mb-1 ${
                          item.submission.percentage >= 80 ? 'text-yellow-500' : 
                          item.submission.percentage >= 60 ? 'text-gray-500' : 'text-red-500'
                        }`} />
                        <p className={`text-lg font-bold ${getGradeColor(item.submission.percentage).split(' ')[0]}`}>
                          {item.submission.percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Grade</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <ChartBarIcon className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {item.submission.score}/{item.submission.totalScore}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <ClockIcon className="h-6 w-6 mx-auto mb-1 text-green-500" />
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatTimeSpent(item.submission.timeSpent)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Time</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <CalendarIcon className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatDate(item.submission.submittedAt).split(',')[0]}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                      </div>
                    </div>
                  )}

                  {isTeacher && (
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span>Average Score: {item.averageScore}%</span>
                      <span>Click to view details</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}