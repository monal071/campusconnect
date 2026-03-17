import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import CreateQuizModal from "../../components/CreateQuizModal";
import TakeQuizModal from "../../components/TakeQuizModal";
import JoinQuizModal from "../../components/JoinQuizModal";
import QuizResultsModal from "../../components/QuizResultsModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  PlusIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  UserGroupIcon,
  TrophyIcon,
  CalendarIcon,
  ArrowRightIcon,
  PlayIcon,
  EyeIcon,
  TrashIcon,
  StopIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function QuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State management
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // Data for faculty and students
  const [facultyQuizzes, setFacultyQuizzes] = useState([]);
  const [studentHistory, setStudentHistory] = useState([]);

  useEffect(() => {
    if (status === "authenticated") {
      if (session.user?.role === "faculty" || session.user?.role === "admin") {
        fetchFacultyQuizzes();
      } else {
        fetchStudentHistory();
      }
    }
  }, [status, session]);

  const fetchFacultyQuizzes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quiz/history");
      const data = await response.json();
      if (response.ok) {
        setFacultyQuizzes(data.history || []);
      }
    } catch (error) {
      console.error("Error fetching faculty quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quiz/history");
      const data = await response.json();
      if (response.ok) {
        setStudentHistory(data.history || []);
      }
    } catch (error) {
      console.error("Error fetching quiz history:", error);
      toast.error("Failed to load quiz history");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = () => {
    setShowCreateModal(true);
  };

  const handleQuizCreated = () => {
    setShowCreateModal(false);
    fetchFacultyQuizzes();
  };

  const handleJoinQuiz = () => {
    setShowJoinModal(true);
  };

  const handleQuizFound = async (quiz) => {
    setSelectedQuiz(quiz);
    setShowTakeModal(true);
  };

  const handleQuizSubmit = async (submissionData) => {
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit quiz");
      }

      toast.success("Quiz submitted successfully!");
      setShowTakeModal(false);
      setSelectedQuiz(null);
      fetchStudentHistory();

      return result;
    } catch (error) {
      toast.error(error.message || "Failed to submit quiz");
      throw error;
    }
  };

  const handleViewResults = (quiz) => {
    setSelectedQuiz(quiz);
    setShowResultsModal(true);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (
      !confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/quiz/${quizId}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Quiz deleted successfully");
        fetchFacultyQuizzes();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete quiz");
      }
    } catch (error) {
      toast.error("Error deleting quiz");
    }
  };

  const handleEndQuiz = async (quizId) => {
    try {
      const response = await fetch("/api/quiz/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      });

      if (response.ok) {
        toast.success("Quiz ended successfully");
        fetchFacultyQuizzes();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to end quiz");
      }
    } catch (error) {
      toast.error("Error ending quiz");
    }
  };

  const handleActivateQuiz = async (quizId) => {
    try {
      const response = await fetch("/api/quiz/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      });

      if (response.ok) {
        toast.success("Quiz activated successfully");
        fetchFacultyQuizzes();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to activate quiz");
      }
    } catch (error) {
      toast.error("Error activating quiz");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimeSpent = (seconds) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90)
      return "text-green-600 bg-green-100 dark:bg-green-900/30";
    if (percentage >= 80)
      return "text-blue-600 bg-blue-100 dark:bg-blue-900/30";
    if (percentage >= 70)
      return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30";
    if (percentage >= 60)
      return "text-orange-600 bg-orange-100 dark:bg-orange-900/30";
    return "text-red-600 bg-red-100 dark:bg-red-900/30";
  };

  if (status === "loading") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const isFaculty =
    session.user?.role === "faculty" || session.user?.role === "admin";

  // Faculty View
  if (isFaculty) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Quizzes
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Create quizzes and view student results
              </p>
            </div>
            <button
              onClick={handleCreateQuiz}
              className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-lg"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Quiz
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <AcademicCapIcon className="h-8 w-8 text-indigo-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {facultyQuizzes.length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Quizzes
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <PlayCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {facultyQuizzes.filter((q) => q.isActive).length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Active Quizzes
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {facultyQuizzes.reduce(
                      (sum, q) => sum + (q.submissionCount || 0),
                      0,
                    )}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Total Submissions
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : facultyQuizzes.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No quizzes yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first quiz to get started
            </p>
            <button
              onClick={handleCreateQuiz}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {facultyQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {quiz.quizName}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          quiz.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {quiz.isActive ? "Active" : "Ended"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{quiz.totalQuestions} questions</span>
                      <span>{quiz.totalPoints} points</span>
                      <span>{quiz.submissionCount || 0} submissions</span>
                      {quiz.averageScore > 0 && (
                        <span>Avg: {quiz.averageScore}%</span>
                      )}
                    </div>
                    {quiz.quizCode && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Code:{" "}
                        </span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {quiz.quizCode}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewResults(quiz)}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title="View Results"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    {quiz.isActive ? (
                      <button
                        onClick={() => handleEndQuiz(quiz._id)}
                        className="p-2 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                        title="End Quiz"
                      >
                        <StopIcon className="h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivateQuiz(quiz._id)}
                        className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Activate Quiz"
                      >
                        <PlayIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteQuiz(quiz._id)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete Quiz"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Submissions Preview */}
                {quiz.submissions && quiz.submissions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Recent Submissions
                    </p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {quiz.submissions.slice(0, 3).map((sub, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700/50 rounded px-3 py-2"
                        >
                          <span className="text-gray-900 dark:text-white">
                            {sub.studentName} ({sub.studentId})
                          </span>
                          <span
                            className={`font-medium ${getGradeColor(sub.percentage)}`}
                          >
                            {sub.percentage?.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                    {quiz.submissions.length > 3 && (
                      <button
                        onClick={() => handleViewResults(quiz)}
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
                      >
                        View all {quiz.submissions.length} submissions →
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Modals */}
        <CreateQuizModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onQuizCreated={handleQuizCreated}
        />

        {selectedQuiz && (
          <QuizResultsModal
            isOpen={showResultsModal}
            onClose={() => {
              setShowResultsModal(false);
              setSelectedQuiz(null);
            }}
            quiz={selectedQuiz}
          />
        )}
      </div>
    );
  }

  // Student View
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Quizzes
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Join quizzes and view your results
            </p>
          </div>
          <button
            onClick={handleJoinQuiz}
            className="flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-lg"
          >
            <ArrowRightIcon className="h-5 w-5 mr-2" />
            Join Quiz
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <AcademicCapIcon className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {studentHistory.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Quizzes Taken
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <TrophyIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {studentHistory.length > 0
                    ? Math.round(
                        studentHistory.reduce(
                          (sum, h) => sum + (h.submission?.percentage || 0),
                          0,
                        ) / studentHistory.length,
                      )
                    : 0}
                  %
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Average Score
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {
                    studentHistory.filter(
                      (h) => (h.submission?.percentage || 0) >= 80,
                    ).length
                  }
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  High Scores (80%+)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Join Quiz Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Ready to take a quiz?
            </h2>
            <p className="text-indigo-100">
              Enter the 6-character code provided by your instructor
            </p>
          </div>
          <button
            onClick={handleJoinQuiz}
            className="px-6 py-3 bg-white text-indigo-600 font-medium rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Join Quiz
          </button>
        </div>
      </div>

      {/* Quiz History */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Your Quiz Results
        </h2>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : studentHistory.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No quizzes taken yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Join a quiz using the code from your instructor
            </p>
            <button
              onClick={handleJoinQuiz}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <ArrowRightIcon className="h-5 w-5 mr-2" />
              Join Quiz
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentHistory.map((item, index) => (
              <motion.div
                key={item._id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {item.quizName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {formatDate(item.submission?.submittedAt || item.endedAt)}
                </p>

                {item.submission && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <TrophyIcon
                        className={`h-6 w-6 mx-auto mb-1 ${
                          item.submission.percentage >= 80
                            ? "text-yellow-500"
                            : item.submission.percentage >= 60
                              ? "text-gray-500"
                              : "text-red-500"
                        }`}
                      />
                      <p
                        className={`text-xl font-bold ${
                          getGradeColor(item.submission.percentage).split(
                            " ",
                          )[0]
                        }`}
                      >
                        {item.submission.percentage?.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Score
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <ChartBarIcon className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {item.submission.score}/{item.submission.totalScore}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Points
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <ClockIcon className="h-6 w-6 mx-auto mb-1 text-green-500" />
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatTimeSpent(item.submission.timeSpent)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Time
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span
                        className={`text-2xl font-bold ${
                          getGradeColor(item.submission.percentage).split(
                            " ",
                          )[0]
                        }`}
                      >
                        {item.submission.grade || "N/A"}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Grade
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <JoinQuizModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onQuizFound={handleQuizFound}
      />

      {selectedQuiz && (
        <TakeQuizModal
          isOpen={showTakeModal}
          onClose={() => {
            setShowTakeModal(false);
            setSelectedQuiz(null);
          }}
          quiz={selectedQuiz}
          onSubmit={handleQuizSubmit}
        />
      )}
    </div>
  );
}
