import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function CreateQuizModal({ isOpen, onClose, onQuizCreated }) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [createdQuizCode, setCreatedQuizCode] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [quizData, setQuizData] = useState({
    quizName: "",
    description: "",
    category: "general",
    difficulty: "medium",
    timeLimit: 60,
    allowRetakes: false,
    showResults: true,
  });

  const [questions, setQuestions] = useState([
    {
      question: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: "",
      points: 1,
      explanation: "",
    },
  ]);

  const [errors, setErrors] = useState({});

  const categories = [
    "general",
    "programming",
    "mathematics",
    "science",
    "literature",
    "history",
    "business",
    "design",
    "technology",
    "research",
  ];

  const difficulties = [
    { value: "easy", label: "Easy", description: "Beginner level" },
    { value: "medium", label: "Medium", description: "Intermediate level" },
    { value: "hard", label: "Hard", description: "Advanced level" },
  ];

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        type: "multiple-choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 1,
        explanation: "",
      },
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const updateQuestionOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const addQuestionOption = (questionIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options.length < 6) {
      updatedQuestions[questionIndex].options.push("");
      setQuestions(updatedQuestions);
    }
  };

  const removeQuestionOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    if (updatedQuestions[questionIndex].options.length > 2) {
      updatedQuestions[questionIndex].options.splice(optionIndex, 1);
      setQuestions(updatedQuestions);
    }
  };

  const validateStep1 = () => {
    const newErrors = {};

    if (!quizData.quizName.trim()) {
      newErrors.quizName = "Quiz name is required";
    }

    if (quizData.timeLimit < 1 || quizData.timeLimit > 180) {
      newErrors.timeLimit = "Time limit must be between 1 and 180 minutes";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    questions.forEach((question, index) => {
      if (!question.question.trim()) {
        newErrors[`question_${index}`] = "Question text is required";
      }

      if (question.type === "multiple-choice") {
        const validOptions = question.options.filter((opt) => opt.trim());
        if (validOptions.length < 2) {
          newErrors[`options_${index}`] = "At least 2 options are required";
        }

        if (!question.correctAnswer.trim()) {
          newErrors[`correct_${index}`] = "Correct answer is required";
        } else if (!question.options.includes(question.correctAnswer)) {
          newErrors[`correct_${index}`] =
            "Correct answer must match one of the options";
        }
      }

      if (question.points < 1 || question.points > 10) {
        newErrors[`points_${index}`] = "Points must be between 1 and 10";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const copyQuizCode = async () => {
    if (createdQuizCode) {
      try {
        await navigator.clipboard.writeText(createdQuizCode);
        setCodeCopied(true);
        toast.success("Quiz code copied to clipboard!");
        setTimeout(() => setCodeCopied(false), 2000);
      } catch (err) {
        toast.error("Failed to copy code");
      }
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/quiz/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...quizData,
          questions: questions.filter((q) => q.question.trim()),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCreatedQuizCode(data.quizCode);
        setCurrentStep(4); // Go to success step with code
        toast.success("Quiz created successfully!");
        onQuizCreated(data);
      } else {
        toast.error(data.message || "Failed to create quiz");
      }
    } catch (error) {
      toast.error("Error creating quiz");
      console.error("Quiz creation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setCreatedQuizCode(null);
    setCodeCopied(false);
    setQuizData({
      quizName: "",
      description: "",
      category: "general",
      difficulty: "medium",
      timeLimit: 60,
      allowRetakes: false,
      showResults: true,
    });
    setQuestions([
      {
        question: "",
        type: "multiple-choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        points: 1,
        explanation: "",
      },
    ]);
    setErrors({});
    onClose();
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Quiz Name *
        </label>
        <input
          type="text"
          value={quizData.quizName}
          onChange={(e) =>
            setQuizData({ ...quizData, quizName: e.target.value })
          }
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Enter quiz name"
        />
        {errors.quizName && (
          <p className="mt-1 text-sm text-red-600">{errors.quizName}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={quizData.description}
          onChange={(e) =>
            setQuizData({ ...quizData, description: e.target.value })
          }
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          rows={3}
          placeholder="Describe what this quiz covers"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Category
          </label>
          <select
            value={quizData.category}
            onChange={(e) =>
              setQuizData({ ...quizData, category: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulty
          </label>
          <select
            value={quizData.difficulty}
            onChange={(e) =>
              setQuizData({ ...quizData, difficulty: e.target.value })
            }
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {difficulties.map((diff) => (
              <option key={diff.value} value={diff.value}>
                {diff.label} - {diff.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Limit (minutes) *
          </label>
          <input
            type="number"
            min="1"
            max="180"
            value={quizData.timeLimit}
            onChange={(e) =>
              setQuizData({
                ...quizData,
                timeLimit: parseInt(e.target.value) || 60,
              })
            }
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {errors.timeLimit && (
            <p className="mt-1 text-sm text-red-600">{errors.timeLimit}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allowRetakes"
            checked={quizData.allowRetakes}
            onChange={(e) =>
              setQuizData({ ...quizData, allowRetakes: e.target.checked })
            }
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label
            htmlFor="allowRetakes"
            className="ml-2 text-sm text-gray-700 dark:text-gray-300"
          >
            Allow students to retake the quiz
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="showResults"
            checked={quizData.showResults}
            onChange={(e) =>
              setQuizData({ ...quizData, showResults: e.target.checked })
            }
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label
            htmlFor="showResults"
            className="ml-2 text-sm text-gray-700 dark:text-gray-300"
          >
            Show results immediately after submission
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Questions ({questions.length})
        </h3>
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Question</span>
        </button>
      </div>

      <div className="space-y-6 max-h-96 overflow-y-auto">
        {questions.map((question, questionIndex) => (
          <div
            key={questionIndex}
            className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-md font-medium text-gray-900 dark:text-white">
                Question {questionIndex + 1}
              </h4>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(questionIndex)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question Text *
                </label>
                <textarea
                  value={question.question}
                  onChange={(e) =>
                    updateQuestion(questionIndex, "question", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Enter your question"
                />
                {errors[`question_${questionIndex}`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`question_${questionIndex}`]}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Points
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={question.points}
                    onChange={(e) =>
                      updateQuestion(
                        questionIndex,
                        "points",
                        parseInt(e.target.value) || 1,
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  {errors[`points_${questionIndex}`] && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors[`points_${questionIndex}`]}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Answer Options *
                </label>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className="flex items-center space-x-2"
                    >
                      <input
                        type="radio"
                        name={`correct_${questionIndex}`}
                        checked={question.correctAnswer === option}
                        onChange={() =>
                          updateQuestion(questionIndex, "correctAnswer", option)
                        }
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          updateQuestionOption(
                            questionIndex,
                            optionIndex,
                            e.target.value,
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      {question.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeQuestionOption(questionIndex, optionIndex)
                          }
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {question.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => addQuestionOption(questionIndex)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm transition-colors"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
                {errors[`options_${questionIndex}`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`options_${questionIndex}`]}
                  </p>
                )}
                {errors[`correct_${questionIndex}`] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[`correct_${questionIndex}`]}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Explanation (Optional)
                </label>
                <textarea
                  value={question.explanation}
                  onChange={(e) =>
                    updateQuestion(questionIndex, "explanation", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={2}
                  placeholder="Explain why this is the correct answer"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <AcademicCapIcon className="mx-auto h-12 w-12 text-indigo-600" />
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
          Review Your Quiz
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Please review all the details before creating your quiz
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Quiz Name
            </span>
            <p className="text-gray-900 dark:text-white">{quizData.quizName}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Category
            </span>
            <p className="text-gray-900 dark:text-white">{quizData.category}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Difficulty
            </span>
            <p className="text-gray-900 dark:text-white">
              {quizData.difficulty}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Time Limit
            </span>
            <p className="text-gray-900 dark:text-white">
              {quizData.timeLimit} minutes
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Questions
            </span>
            <p className="text-gray-900 dark:text-white">{questions.length}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Points
            </span>
            <p className="text-gray-900 dark:text-white">
              {questions.reduce((sum, q) => sum + q.points, 0)}
            </p>
          </div>
        </div>

        {quizData.description && (
          <div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Description
            </span>
            <p className="text-gray-900 dark:text-white">
              {quizData.description}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {quizData.allowRetakes && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Retakes Allowed
            </span>
          )}
          {quizData.showResults && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
              Immediate Results
            </span>
          )}
        </div>

        <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <p className="text-sm text-indigo-800 dark:text-indigo-200">
            <strong>Note:</strong> A unique quiz code will be generated after
            creation. Share this code with your students so they can join and
            take the quiz.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900">
          <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
          Quiz Created Successfully!
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Your quiz has been created. Share the code below with your students.
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Quiz Code
          </p>
          <div className="flex items-center justify-center space-x-3">
            <span className="text-4xl font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
              {createdQuizCode}
            </span>
            <button
              onClick={copyQuizCode}
              className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
              title="Copy code"
            >
              {codeCopied ? (
                <CheckIcon className="h-6 w-6 text-green-500" />
              ) : (
                <ClipboardDocumentIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
            <strong>Instructions for students:</strong>
            <br />
            Go to the Quiz section and click &quot;Join Quiz&quot;, then enter code{" "}
            <strong>{createdQuizCode}</strong>
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleClose}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="relative z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={handleClose}
          />

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl border border-gray-200 dark:border-gray-700"
                onClick={(e) => e.stopPropagation()}
              >
                {currentStep < 4 && (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          Create New Quiz
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Step {currentStep} of 3
                        </p>
                      </div>
                      <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                      <div className="flex items-center">
                        {[1, 2, 3].map((step) => (
                          <div key={step} className="flex items-center">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                                step <= currentStep
                                  ? "bg-indigo-600 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {step}
                            </div>
                            {step < 3 && (
                              <div
                                className={`w-16 h-0.5 ${
                                  step < currentStep
                                    ? "bg-indigo-600"
                                    : "bg-gray-200 dark:bg-gray-700"
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Basic Info
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Questions
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Review
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Step Content */}
                <div className="min-h-[400px]">
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  {currentStep === 3 && renderStep3()}
                  {currentStep === 4 && renderStep4()}
                </div>

                {/* Navigation Buttons */}
                {currentStep < 4 && (
                  <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={currentStep === 1}
                      className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Back
                    </button>

                    <div className="space-x-4">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>

                      {currentStep < 3 ? (
                        <button
                          type="button"
                          onClick={handleNext}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isLoading}
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                        >
                          {isLoading && (
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              xmlns="http://www.w3.org/2000/svg"
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
                          )}
                          <span>Create Quiz</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
