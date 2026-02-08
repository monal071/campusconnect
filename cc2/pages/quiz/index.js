import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import toast from "react-hot-toast";
import CreateQuizModal from "../../components/CreateQuizModal";
import QuizCard from "../../components/QuizCard";
import QuizResultsModal from "../../components/QuizResultsModal";
import TakeQuizModal from "../../components/TakeQuizModal";
import JoinPrivateQuizModal from "../../components/JoinPrivateQuizModal";
import {
  PlusIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

export default function QuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showTakeModal, setShowTakeModal] = useState(false);
  const [showJoinPrivateModal, setShowJoinPrivateModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchQuizzes();
  }, [status, searchTerm, statusFilter, sortBy]);

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter,
        sortBy,
        sortOrder: "desc",
        _t: Date.now(),
      });

      const response = await fetch(`/api/quiz/list?${params}`, {
        cache: "no-cache",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await response.json();

      if (response.ok) {
        setQuizzes(data.quizzes || []);
      } else {
        throw new Error(data.message || "Failed to fetch quizzes");
      }
    } catch (error) {
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
    toast.success("Quiz created successfully");
  };

  const handleViewResults = (quiz) => {
    setSelectedQuiz(quiz);
    setShowResultsModal(true);
  };

  const handleTakeQuiz = async (quiz) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quiz/${quiz._id}`);

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.message || "Failed to load quiz");
        return;
      }

      const fullQuiz = await response.json();

      if (fullQuiz.requiresPassword && !fullQuiz.questions) {
        if (quiz.password) {
          const passwordResponse = await fetch(
            `/api/quiz/${quiz._id}?password=${encodeURIComponent(quiz.password)}`,
          );

          if (passwordResponse.ok) {
            const fullQuizWithPassword = await passwordResponse.json();
            setSelectedQuiz(fullQuizWithPassword);
            setShowTakeModal(true);
          } else {
            toast.error("Unable to access this private quiz");
          }
        } else {
          toast.error(
            'This quiz requires a password. Use "Join Private Quiz" to access it.',
          );
        }
      } else {
        setSelectedQuiz(fullQuiz);
        setShowTakeModal(true);
      }
    } catch (error) {
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPrivateQuiz = () => {
    setShowJoinPrivateModal(true);
  };

  const handlePrivateQuizFound = (quiz) => {
    setQuizzes((prev) => {
      const exists = prev.find((q) => q._id === quiz._id);
      return exists ? prev : [quiz, ...prev];
    });
    toast.success("Private quiz found! Opening quiz...");
    handleTakeQuiz(quiz);
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

      toast.success("Quiz submitted successfully");
      setShowTakeModal(false);
      setSelectedQuiz(null);
      fetchQuizzes();
      return result;
    } catch (error) {
      toast.error(error.message || "Failed to submit quiz");
      throw error;
    }
  };

  const handleEditQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setShowCreateModal(true);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    try {
      const response = await fetch(`/api/quiz/${quizId}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Quiz deleted");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId }),
      });

      if (response.ok) {
        toast.success("Quiz ended");
        fetchQuizzes();
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
        toast.success("Quiz activated");
        fetchQuizzes();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to activate quiz");
      }
    } catch (error) {
      toast.error("Error activating quiz");
    }
  };

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (
      searchTerm &&
      !quiz.quizName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const isFaculty =
    session?.user?.role === "faculty" || session?.user?.role === "admin";

  const activeCount = quizzes.filter((q) => q.status === "active").length;

  if (status === "loading" || (loading && quizzes.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Head>
        <title>Quizzes - CampusConnect</title>
      </Head>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quizzes
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isFaculty
              ? "Create and manage your quizzes"
              : "Take quizzes and track your progress"}
          </p>
        </div>
        <div className="flex gap-2">
          {isFaculty ? (
            <button
              onClick={handleCreateQuiz}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Create Quiz
            </button>
          ) : (
            <button
              onClick={handleJoinPrivateQuiz}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <LockClosedIcon className="h-4 w-4" />
              Join Private Quiz
            </button>
          )}
        </div>
      </div>

      {/* Faculty Stats */}
      {isFaculty && quizzes.length > 0 && (
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
            <AcademicCapIcon className="h-5 w-5 text-indigo-500" />
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {quizzes.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                My Quizzes
              </p>
            </div>
          </div>
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
            <ClockIcon className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {activeCount}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">All Active</option>
          <option value="active">Active Only</option>
          <option value="draft">Draft</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="created">Newest First</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Content */}
      {error ? (
        <div className="text-center py-16">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchQuizzes}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Try Again
          </button>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 mb-4">
            {searchTerm ? "No quizzes match your search" : "No quizzes yet"}
          </p>
          {isFaculty && !searchTerm && (
            <button
              onClick={handleCreateQuiz}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Create your first quiz
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => (
            <QuizCard
              key={quiz._id}
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
