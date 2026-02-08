import React, { useState, useCallback, useMemo } from "react";
import {
  ClockIcon,
  AcademicCapIcon,
  TrashIcon,
  PencilIcon,
  ChartBarIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function QuizCard({
  quiz,
  userRole,
  userSession,
  onEdit,
  onDelete,
  onViewResults,
  onTake,
  onEnd,
  onActivate,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [actionType, setActionType] = useState(null);

  const isTeacher = useMemo(
    () => userRole === "faculty" || userRole === "admin",
    [userRole],
  );

  const formatDate = useCallback((dateString) => {
    if (!dateString) return "No date set";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Date error";
    }
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "ended":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "draft":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  }, []);

  const getDifficultyColor = useCallback((difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "expert":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  }, []);

  const quizStatus = useMemo(() => {
    if (!quiz)
      return {
        status: "unknown",
        canTake: false,
        displayText: "Unknown",
        hasSubmitted: false,
      };

    const isActive = quiz.isActive === true;
    const status = isActive ? "active" : "ended";
    const hasSubmitted = quiz.hasSubmitted || false;

    let canTake = isActive && !isTeacher && !hasSubmitted;
    let displayText = status === "active" ? "Active" : "Ended";

    if (hasSubmitted) {
      displayText = "Completed";
      canTake = false;
    }

    return {
      status,
      isActive,
      canTake,
      hasSubmitted,
      displayText,
      color: getStatusColor(hasSubmitted ? "completed" : status),
    };
  }, [quiz, isTeacher, userSession, getStatusColor]);

  const handleAsyncOperation = async (operation, operationType) => {
    if (isLoading) return;
    setIsLoading(true);
    setActionType(operationType);
    try {
      await operation();
    } catch (error) {
      toast.error(`Failed to ${operationType.toLowerCase()}: ${error.message}`);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  const handleEndQuiz = useCallback(async () => {
    if (!quiz?._id) return;
    if (
      !confirm(
        `End "${quiz.quizName}"? Students will no longer be able to take this quiz.`,
      )
    )
      return;
    await handleAsyncOperation(async () => {
      await onEnd(quiz._id);
    }, "End Quiz");
  }, [quiz, onEnd]);

  const handleActivateQuiz = useCallback(async () => {
    if (!quiz?._id) return;
    if (!confirm(`Reactivate "${quiz.quizName}"?`)) return;
    await handleAsyncOperation(async () => {
      await onActivate(quiz._id);
    }, "Activate Quiz");
  }, [quiz, onActivate]);

  const handleDelete = useCallback(async () => {
    if (!quiz?._id) return;
    if (!confirm(`Delete "${quiz.quizName}"? This cannot be undone.`)) return;
    await handleAsyncOperation(async () => {
      await onDelete(quiz._id);
    }, "Delete Quiz");
  }, [quiz, onDelete]);

  const handleTakeQuiz = useCallback(() => {
    if (!quiz || !quizStatus.canTake || !onTake) return;
    onTake(quiz);
  }, [quiz, quizStatus.canTake, onTake]);

  if (!quiz) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 dark:text-red-300 text-sm">
            Quiz data not available
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
              {quiz.quizName || "Untitled Quiz"}
            </h3>
            {quiz.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                {quiz.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${quizStatus.color}`}
            >
              {quizStatus.displayText}
            </span>
            {!quiz.isPublic && (
              <span className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                <LockClosedIcon className="h-3 w-3 mr-0.5" />
                Private
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {quiz.difficulty && (
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${getDifficultyColor(quiz.difficulty)}`}
            >
              {quiz.difficulty.charAt(0).toUpperCase() +
                quiz.difficulty.slice(1)}
            </span>
          )}
          {quiz.category && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {quiz.category}
            </span>
          )}
          {isTeacher && quiz.password && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 max-w-24 truncate">
              Key: {quiz.password}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 pb-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <AcademicCapIcon className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {quiz.totalQuestions || 0}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Questions
            </p>
          </div>
          <div className="text-center p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <ClockIcon className="h-4 w-4 text-blue-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {quiz.timeLimit || 0}m
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Time</p>
          </div>
          <div className="text-center p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <ChartBarIcon className="h-4 w-4 text-purple-500 mx-auto mb-1" />
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {quiz.totalPoints || 0}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              Points
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-200 dark:border-gray-700">
        {isTeacher ? (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-1.5">
              <button
                onClick={() => onViewResults?.(quiz)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ChartBarIcon className="h-4 w-4 mr-1.5" />
                Results
              </button>
              <button
                onClick={() => onEdit?.(quiz)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-1.5" />
                Edit
              </button>
              {quizStatus.status === "active" ? (
                <button
                  onClick={handleEndQuiz}
                  disabled={isLoading && actionType === "End Quiz"}
                  className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors disabled:cursor-not-allowed"
                >
                  <StopIcon className="h-4 w-4 mr-1.5" />
                  End
                </button>
              ) : (
                <button
                  onClick={handleActivateQuiz}
                  disabled={isLoading && actionType === "Activate Quiz"}
                  className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded-md transition-colors disabled:cursor-not-allowed"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                  Activate
                </button>
              )}
            </div>
            <button
              onClick={handleDelete}
              disabled={isLoading && actionType === "Delete Quiz"}
              className="inline-flex items-center px-2 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={handleTakeQuiz}
              disabled={!quizStatus.canTake}
              className="w-full inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              {quizStatus.canTake
                ? "Take Quiz"
                : quizStatus.hasSubmitted
                  ? "Completed"
                  : "Not Available"}
            </button>
            {quiz.createdByName && (
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>By {quiz.createdByName}</span>
                {quiz.createdAt && <span>{formatDate(quiz.createdAt)}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
