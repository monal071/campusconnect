import { useState } from "react";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  MinusCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * Calculate partial credit for a question
 */
export function calculatePartialCredit(question, studentAnswer) {
  const { type, correctAnswer, points = 1, partialCreditRules } = question;

  // Full credit if correct
  if (isAnswerCorrect(type, studentAnswer, correctAnswer)) {
    return {
      points: points,
      percentage: 100,
      feedback: "Correct!",
      status: "correct",
    };
  }

  // No partial credit for some question types
  if (type === "true-false" || type === "essay") {
    return {
      points: 0,
      percentage: 0,
      feedback: type === "essay" ? "Requires manual grading" : "Incorrect",
      status: type === "essay" ? "pending" : "incorrect",
    };
  }

  // Check for partial credit rules
  if (!partialCreditRules || partialCreditRules.length === 0) {
    return {
      points: 0,
      percentage: 0,
      feedback: "Incorrect",
      status: "incorrect",
    };
  }

  // Apply partial credit rules
  for (const rule of partialCreditRules) {
    if (rule.condition === "contains" && type === "short-answer") {
      const answer = String(studentAnswer).toLowerCase();
      const keywords = rule.keywords?.map((k) => k.toLowerCase()) || [];
      const matchedKeywords = keywords.filter((k) => answer.includes(k));

      if (matchedKeywords.length >= (rule.minimumKeywords || 1)) {
        const earnedPoints = points * rule.creditPercentage;
        return {
          points: earnedPoints,
          percentage: rule.creditPercentage * 100,
          feedback: `Partial credit: ${matchedKeywords.length} key concepts identified`,
          status: "partial",
        };
      }
    }

    if (rule.condition === "close" && type === "multiple-choice") {
      if (rule.options?.includes(studentAnswer)) {
        const earnedPoints = points * rule.creditPercentage;
        return {
          points: earnedPoints,
          percentage: rule.creditPercentage * 100,
          feedback: `Partial credit: ${rule.feedback || "Close answer"}`,
          status: "partial",
        };
      }
    }
  }

  // No partial credit earned
  return {
    points: 0,
    percentage: 0,
    feedback: "Incorrect",
    status: "incorrect",
  };
}

/**
 * Check if answer is correct
 */
function isAnswerCorrect(type, studentAnswer, correctAnswer) {
  if (type === "multiple-choice" || type === "true-false") {
    return studentAnswer === correctAnswer;
  }
  if (type === "short-answer") {
    return (
      String(studentAnswer).toLowerCase().trim() ===
      String(correctAnswer).toLowerCase().trim()
    );
  }
  return false;
}

/**
 * Partial Credit Settings Component
 */
export default function PartialCreditSettings({ question, onChange }) {
  const [rules, setRules] = useState(question.partialCreditRules || []);

  const addRule = () => {
    const newRule = {
      id: Date.now(),
      condition: question.type === "short-answer" ? "contains" : "close",
      creditPercentage: 0.5,
      keywords: [],
      options: [],
      minimumKeywords: 1,
      feedback: "",
    };
    const newRules = [...rules, newRule];
    setRules(newRules);
    onChange?.({ ...question, partialCreditRules: newRules });
  };

  const updateRule = (index, updates) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], ...updates };
    setRules(newRules);
    onChange?.({ ...question, partialCreditRules: newRules });
  };

  const removeRule = (index) => {
    const newRules = rules.filter((_, i) => i !== index);
    setRules(newRules);
    onChange?.({ ...question, partialCreditRules: newRules });
  };

  if (question.type === "true-false" || question.type === "essay") {
    return (
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <InformationCircleIcon className="w-5 h-5" />
          <span>
            Partial credit not available for {question.type} questions
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AcademicCapIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Partial Credit Rules
          </h4>
        </div>
        <button
          onClick={addRule}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add Rule
        </button>
      </div>

      {rules.length === 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center text-gray-600 dark:text-gray-400">
          No partial credit rules. Answers will be marked as fully correct or
          incorrect.
        </div>
      )}

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div
            key={rule.id}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 rounded text-sm font-medium">
                  {Math.round(rule.creditPercentage * 100)}% Credit
                </span>
              </div>
              <button
                onClick={() => removeRule(index)}
                className="text-red-600 hover:text-red-700 dark:text-red-400"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Credit Percentage */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credit Percentage: {Math.round(rule.creditPercentage * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={rule.creditPercentage}
                onChange={(e) =>
                  updateRule(index, {
                    creditPercentage: parseFloat(e.target.value),
                  })
                }
                className="w-full"
              />
            </div>

            {/* Short Answer Rules */}
            {question.type === "short-answer" && (
              <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Keywords (student must include at least {rule.minimumKeywords}
                  )
                </label>
                <div className="space-y-2">
                  {rule.keywords?.map((keyword, kIndex) => (
                    <div key={kIndex} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={keyword}
                        onChange={(e) => {
                          const newKeywords = [...rule.keywords];
                          newKeywords[kIndex] = e.target.value;
                          updateRule(index, { keywords: newKeywords });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                        placeholder="Enter keyword"
                      />
                      <button
                        onClick={() => {
                          const newKeywords = rule.keywords.filter(
                            (_, i) => i !== kIndex
                          );
                          updateRule(index, { keywords: newKeywords });
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      updateRule(index, {
                        keywords: [...(rule.keywords || []), ""],
                      });
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    + Add Keyword
                  </button>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Keywords Required
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={rule.keywords?.length || 1}
                    value={rule.minimumKeywords}
                    onChange={(e) =>
                      updateRule(index, {
                        minimumKeywords: parseInt(e.target.value),
                      })
                    }
                    className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                  />
                </div>
              </>
            )}

            {/* Multiple Choice Rules */}
            {question.type === "multiple-choice" && (
              <>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  "Close" Answer Options (partially correct)
                </label>
                <div className="space-y-2">
                  {question.options
                    ?.filter((opt) => opt !== question.correctAnswer)
                    .map((option) => (
                      <label key={option} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={rule.options?.includes(option)}
                          onChange={(e) => {
                            const newOptions = e.target.checked
                              ? [...(rule.options || []), option]
                              : rule.options.filter((o) => o !== option);
                            updateRule(index, { options: newOptions });
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-gray-900 dark:text-white">
                          {option}
                        </span>
                      </label>
                    ))}
                </div>
              </>
            )}

            {/* Feedback */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Feedback (optional)
              </label>
              <input
                type="text"
                value={rule.feedback}
                onChange={(e) =>
                  updateRule(index, { feedback: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700"
                placeholder="e.g., 'Close, but consider...'"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Display partial credit result
 */
export function PartialCreditResult({ result }) {
  const icons = {
    correct: CheckCircleIcon,
    partial: MinusCircleIcon,
    incorrect: XCircleIcon,
    pending: InformationCircleIcon,
  };

  const colors = {
    correct:
      "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    partial:
      "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
    incorrect: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    pending: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800",
  };

  const Icon = icons[result.status] || InformationCircleIcon;
  const colorClass = colors[result.status] || colors.pending;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1">
        <div className="font-medium">
          {result.points.toFixed(2)} / {result.maxPoints || 1} points
          {result.percentage > 0 && result.percentage < 100 && (
            <span className="ml-2 text-sm">({result.percentage}%)</span>
          )}
        </div>
        {result.feedback && (
          <div className="text-sm opacity-90">{result.feedback}</div>
        )}
      </div>
    </div>
  );
}
