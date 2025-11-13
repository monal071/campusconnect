import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import CreateQuizModal from "../../components/CreateQuizModal";
import QuizCard from "../../components/QuizCard";
import QuizResultsModal from "../../components/QuizResultsModal";
import TakeQuizModal from "../../components/TakeQuizModal";
import JoinPrivateQuizModal from "../../components/JoinPrivateQuizModal";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  PlusIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function QuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State management
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [showJoinPrivateModal, setShowJoinPrivateModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created");

  useEffect(() => {
    if (status === "authenticated") {
      fetchQuizzes();
    }
  }, [status, searchTerm, statusFilter, sortBy]);

  // Force refresh every time the page loads to avoid caching issues
  useEffect(() => {
    if (status === "authenticated") {
      const timer = setTimeout(() => {
        fetchQuizzes();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        sortBy,
        sortOrder: "desc",
        _t: Date.now(), // Cache busting timestamp
      });

      const response = await fetch(`/api/quiz/list?${params}`, {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });
      const data = await response.json();

      if (response.ok) {
        // console.log('Fresh quiz data received:', data.quizzes);
        setQuizzes(data.quizzes || []);
      } else {
        throw new Error(data.message || "Failed to fetch quizzes");
      }
    } catch (error) {
      console.error("Fetch quizzes error:", error);
      setError(error.message);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = () => {
    if (session?.user?.role === "faculty" || session?.user?.role === "admin") {
      setShowCreateModal(true);
    } else {
      toast.error("Only faculty members can create quizzes");
    }
  };

  const handleQuizCreated = () => {
    setShowCreateModal(false);
    fetchQuizzes();
    toast.success("Quiz created successfully!");
  };

  const handleViewResults = (quiz) => {
    setSelectedQuiz(quiz);
    setShowResultsModal(true);
  };

  const handleTakeQuiz = async (quiz) => {
    // console.log('🎯 handleTakeQuiz called with quiz:', quiz);
    try {
      setLoading(true);

      // Fetch full quiz data with questions
      console.log("🔍 Fetching quiz data from API:", `/api/quiz/${quiz._id}`);
      const response = await fetch(`/api/quiz/${quiz._id}`, {
        method: "GET",
      });

      console.log("📡 API Response status:", response.status, response.ok);

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ API Error:", error);
        toast.error(error.message || "Failed to load quiz");
        return;
      }

      const fullQuiz = await response.json();
      // console.log('✅ Full quiz data received:', fullQuiz);

      // Check if this is a password-protected quiz without questions
      if (fullQuiz.requiresPassword && !fullQuiz.questions) {
        console.log(
          "🔒 Password-protected quiz detected, fetching with password"
        );
        // For private quiz, try to fetch with the password from the quiz object
        if (quiz.password) {
          console.log("🔑 Using password from quiz object to fetch full data");
          const passwordResponse = await fetch(
            `/api/quiz/${quiz._id}?password=${encodeURIComponent(
              quiz.password
            )}`,
            {
              method: "GET",
            }
          );

          if (passwordResponse.ok) {
            const fullQuizWithPassword = await passwordResponse.json();
            console.log("✅ Full quiz data with questions received");
            setSelectedQuiz(fullQuizWithPassword);
            setShowTakeModal(true);
          } else {
            console.error("❌ Failed to fetch quiz with password");
            toast.error("Unable to access this private quiz");
          }
        } else {
          console.error("❌ Private quiz but no password available");
          toast.error(
            'This private quiz requires a password. Use "Join Private Quiz" to access it.'
          );
        }
      } else {
        // Full quiz data with questions
        setSelectedQuiz(fullQuiz);
        console.log("🎯 Setting showTakeModal to true");
        setShowTakeModal(true);
      }
    } catch (error) {
      console.error("💥 Exception in handleTakeQuiz:", error);
      toast.error("Failed to load quiz");
      console.error("Error loading quiz:", error);
    } finally {
      setLoading(false);
      console.log("🏁 handleTakeQuiz finished");
    }
  };

  // Handle password verification and re-fetch full quiz data
  const handleQuizPasswordVerified = async (quizId, password) => {
    console.log("🔑 Password verified, fetching full quiz data with password");
    try {
      const response = await fetch(
        `/api/quiz/${quizId}?password=${encodeURIComponent(password)}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to load quiz with password");
      }

      const fullQuiz = await response.json();
      console.log("✅ Full quiz data with questions received:", fullQuiz);
      setSelectedQuiz(fullQuiz);
    } catch (error) {
      console.error("❌ Error fetching quiz with password:", error);
      toast.error("Failed to load quiz: " + error.message);
    }
  };

  const handleJoinPrivateQuiz = () => {
    setShowJoinPrivateModal(true);
  };

  const handlePrivateQuizFound = (quiz) => {
    // Add the found quiz to the list if it's not already there
    setQuizzes((prev) => {
      const exists = prev.find((q) => q._id === quiz._id);
      if (exists) {
        return prev;
      }
      return [quiz, ...prev];
    });

    // Auto-open the quiz for taking since password was already verified
    toast.success("Private quiz found! Opening quiz...");
    handleTakeQuiz(quiz);
  };

  const handleQuizSubmit = async (submissionData) => {
    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit quiz");
      }

      toast.success("Quiz submitted successfully!");
      setShowTakeModal(false);
      setSelectedQuiz(null);
      fetchQuizzes();

      return result;
    } catch (error) {
      toast.error(error.message || "Failed to submit quiz");
      throw error;
    }
  };

  const handleQuizSubmitted = () => {
    setShowTakeModal(false);
    setSelectedQuiz(null);
    fetchQuizzes();
  };

  const handleEditQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setShowCreateModal(true);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (
      !confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/quiz/${quizId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Quiz deleted successfully");
        fetchQuizzes();
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quizId }),
      });

      if (response.ok) {
        toast.success("Quiz ended successfully");
        fetchQuizzes(); // Refresh the quiz list
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to end quiz");
      }
    } catch (error) {
      console.error("Error ending quiz:", error);
      toast.error("Error ending quiz");
    }
  };

  const handleActivateQuiz = async (quizId) => {
    try {
      const response = await fetch("/api/quiz/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quizId }),
      });

      if (response.ok) {
        toast.success("Quiz activated successfully");
        fetchQuizzes(); // Refresh the quiz list
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to activate quiz");
      }
    } catch (error) {
      console.error("Error activating quiz:", error);
      toast.error("Error activating quiz");
    }
  };

  const getQuizStats = () => {
    const totalQuizzes = quizzes.length;
    const activeQuizzes = quizzes.filter(
      (quiz) => quiz.status === "active"
    ).length;

    return { totalQuizzes, activeQuizzes };
  };

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (
      searchTerm &&
      !quiz.quizName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

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

  const stats = getQuizStats();
  const isFaculty =
    session.user?.role === "faculty" || session.user?.role === "admin";

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
                {isFaculty
                  ? "Create and manage your quizzes"
                  : "Take quizzes and view your progress"}
              </p>
            </div>

            <div className="flex space-x-3">
              {isFaculty && (
                <button
                  onClick={handleCreateQuiz}
                  className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Quiz
                </button>
              )}

              {!isFaculty && (
                <button
                  onClick={handleJoinPrivateQuiz}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <LockClosedIcon className="h-5 w-5 mr-2" />
                  Join Private Quiz
                </button>
              )}
            </div>
          </div>

          {/* Stats Cards - Only show for faculty */}
          {isFaculty && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center">
                  <AcademicCapIcon className="h-8 w-8 text-indigo-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalQuizzes}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      My Quizzes
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.activeQuizzes}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Active
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="flex-1 max-w-md relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Manual Refresh Button for Debugging */}
              <button
                onClick={() => {
                  console.log("Manual refresh triggered");
                  fetchQuizzes();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh
              </button>

              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Active</option>
                  <option value="active">Active Only</option>
                  <option value="draft">Draft</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="created">Newest First</option>
                  <option value="name">Name A-Z</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchQuizzes}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-12">
            <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchTerm ? "No quizzes found" : "No quizzes yet"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm
                ? "Try adjusting your search."
                : isFaculty
                ? "Create your first quiz to get started."
                : "Check back later for new quizzes."}
            </p>
            {isFaculty && !searchTerm && (
              <button
                onClick={handleCreateQuiz}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Quiz
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz, index) => (
              <motion.div
                key={quiz._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <QuizCard
                  quiz={quiz}
                  onTake={handleTakeQuiz}
                  onViewResults={handleViewResults}
                  onEdit={handleEditQuiz}
                  onDelete={handleDeleteQuiz}
                  onEnd={handleEndQuiz}
                  onActivate={handleActivateQuiz}
                  userRole={session.user?.role}
                  userSession={session}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Modals */}
        <CreateQuizModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedQuiz(null);
          }}
          onQuizCreated={handleQuizCreated}
          editQuiz={selectedQuiz}
        />

        {selectedQuiz && (
          <>
            <QuizResultsModal
              isOpen={showResultsModal}
              onClose={() => {
                setShowResultsModal(false);
                setSelectedQuiz(null);
              }}
              quiz={selectedQuiz}
            />

            <TakeQuizModal
              isOpen={showTakeModal}
              onClose={() => {
                setShowTakeModal(false);
                setSelectedQuiz(null);
              }}
              quiz={selectedQuiz}
              onSubmit={handleQuizSubmit}
            />
          </>
        )}

        <JoinPrivateQuizModal
          isOpen={showJoinPrivateModal}
          onClose={() => setShowJoinPrivateModal(false)}
          onQuizFound={handlePrivateQuizFound}
        />
      </div>
  );
}
