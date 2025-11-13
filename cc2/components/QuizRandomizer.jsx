import { useState, useEffect } from 'react';
import { ArrowsRightLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray(array, seed = null) {
  const arr = [...array];
  const random = seed ? seededRandom(seed) : Math.random;
  
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Seeded random number generator for consistent shuffling per student
 */
function seededRandom(seed) {
  let value = seed;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

/**
 * Randomize quiz questions and options for a specific student
 */
export function randomizeQuizForStudent(quiz, studentId) {
  // Create a seed from studentId and quizId
  const seed = parseInt(studentId.replace(/\D/g, '').slice(0, 8)) + 
                parseInt(quiz._id.replace(/\D/g, '').slice(0, 8));

  // Shuffle questions if enabled
  const questions = quiz.settings?.randomizeQuestions 
    ? shuffleArray(quiz.questions, seed)
    : [...quiz.questions];

  // Shuffle options for each question if enabled
  const randomizedQuestions = questions.map((question, index) => {
    if (quiz.settings?.randomizeOptions && question.options) {
      // Create question-specific seed
      const questionSeed = seed + index;
      
      // Keep track of correct answer before shuffling
      const correctAnswer = question.correctAnswer;
      const correctIndex = question.options.indexOf(correctAnswer);
      
      // Shuffle options
      const shuffledOptions = shuffleArray(question.options, questionSeed);
      
      // Update correct answer to new position
      const newCorrectAnswer = shuffledOptions[shuffledOptions.indexOf(correctAnswer)];
      
      return {
        ...question,
        options: shuffledOptions,
        correctAnswer: newCorrectAnswer,
        originalOrder: question.options, // Keep original for grading
      };
    }
    return question;
  });

  return {
    ...quiz,
    questions: randomizedQuestions,
    isRandomized: true,
  };
}

/**
 * Settings component for quiz randomization
 */
export default function QuizRandomizerSettings({ settings = {}, onChange }) {
  const [randomizeQuestions, setRandomizeQuestions] = useState(
    settings.randomizeQuestions || false
  );
  const [randomizeOptions, setRandomizeOptions] = useState(
    settings.randomizeOptions || false
  );

  const handleToggleQuestions = () => {
    const newValue = !randomizeQuestions;
    setRandomizeQuestions(newValue);
    onChange?.({
      ...settings,
      randomizeQuestions: newValue,
    });
  };

  const handleToggleOptions = () => {
    const newValue = !randomizeOptions;
    setRandomizeOptions(newValue);
    onChange?.({
      ...settings,
      randomizeOptions: newValue,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center gap-3">
        <ArrowsRightLeftIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Randomization Settings
        </h3>
      </div>

      {/* Randomize Questions */}
      <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white">
            Randomize Question Order
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Each student sees questions in a different order
          </div>
        </div>
        <input
          type="checkbox"
          checked={randomizeQuestions}
          onChange={handleToggleQuestions}
          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      </label>

      {/* Randomize Options */}
      <label className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white">
            Randomize Answer Options
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Shuffle A, B, C, D options for each question
          </div>
        </div>
        <input
          type="checkbox"
          checked={randomizeOptions}
          onChange={handleToggleOptions}
          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      </label>

      {/* Info */}
      {(randomizeQuestions || randomizeOptions) && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <CheckCircleIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Anti-cheating enabled:</strong> Each student will see a unique
            question/option order, but grading remains consistent.
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Preview component showing randomized quiz
 */
export function RandomizedQuizPreview({ quiz, studentId }) {
  const [randomizedQuiz, setRandomizedQuiz] = useState(null);

  useEffect(() => {
    if (quiz && studentId) {
      const randomized = randomizeQuizForStudent(quiz, studentId);
      setRandomizedQuiz(randomized);
    }
  }, [quiz, studentId]);

  if (!randomizedQuiz) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <ArrowsRightLeftIcon className="w-4 h-4" />
        <span>Preview: Questions randomized for this student</span>
      </div>

      <div className="space-y-4">
        {randomizedQuiz.questions.map((question, index) => (
          <div
            key={index}
            className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="font-medium text-gray-900 dark:text-white mb-3">
              {index + 1}. {question.question}
            </div>
            <div className="space-y-2">
              {question.options?.map((option, optIndex) => (
                <div
                  key={optIndex}
                  className={`p-2 rounded ${
                    option === question.correctAnswer
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-200'
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  {String.fromCharCode(65 + optIndex)}. {option}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
