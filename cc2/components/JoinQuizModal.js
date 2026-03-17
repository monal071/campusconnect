import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  AcademicCapIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function JoinQuizModal({ isOpen, onClose, onQuizFound }) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error("Please enter a quiz code");
      return;
    }

    if (code.trim().length !== 6) {
      toast.error("Quiz code must be 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/quiz/get?code=${encodeURIComponent(code.trim().toUpperCase())}`,
        {
          method: "GET",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Quiz not found");
      }

      toast.success(`Found quiz: ${result.quiz.quizName}`);
      onQuizFound(result.quiz);
      setCode("");
      onClose();
    } catch (error) {
      toast.error(error.message || "Quiz not found or invalid code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCode("");
    onClose();
  };

  const handleCodeChange = (e) => {
    // Convert to uppercase and only allow alphanumeric characters
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length <= 6) {
      setCode(value);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <AcademicCapIcon className="h-8 w-8 text-indigo-500" />
                    </div>
                    <div className="ml-3">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Join Quiz
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Enter the 6-character quiz code provided by your instructor.
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                      <label
                        htmlFor="quiz-code"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Quiz Code
                      </label>
                      <input
                        type="text"
                        id="quiz-code"
                        value={code}
                        onChange={handleCodeChange}
                        className="w-full px-4 py-4 text-center text-3xl font-bold tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                        placeholder="XXXXXX"
                        autoFocus
                        disabled={isLoading}
                        maxLength={6}
                      />
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                        {code.length}/6 characters
                      </p>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        disabled={isLoading || code.trim().length !== 6}
                      >
                        {isLoading ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            <span>Joining...</span>
                          </>
                        ) : (
                          <>
                            <span>Join Quiz</span>
                            <ArrowRightIcon className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AcademicCapIcon className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-indigo-800 dark:text-indigo-200">
                        <strong>Tip:</strong> Ask your instructor for the quiz
                        code. It will be a 6-character code like "ABC123".
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
