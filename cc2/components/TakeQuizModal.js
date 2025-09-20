import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import PasswordPromptModal from './PasswordPromptModal';

export default function TakeQuizModal({ isOpen, onClose, quiz, onSubmit, onPasswordVerified }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState({ studentId: '', studentName: '' });
  const [showStudentForm, setShowStudentForm] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);

  // Initialize quiz when quiz changes
  useEffect(() => {
    if (quiz && isOpen) {
      setAnswers(new Array(quiz.questions?.length || 0).fill(''));
      setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
      setCurrentQuestion(0);
      setStartTime(null);
      
      // Check if quiz requires password
      if (!quiz.isPublic && quiz.password) {
        setShowPasswordModal(true);
        setShowStudentForm(false);
        setIsPasswordVerified(false);
      } else {
        setShowStudentForm(true);
        setShowPasswordModal(false);
        setIsPasswordVerified(true);
      }
    }
  }, [quiz, isOpen]);

  // Timer countdown
  useEffect(() => {
    let interval;
    if (!showStudentForm && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showStudentForm, timeRemaining]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (timeRemaining / (quiz.timeLimit * 60)) * 100;
    if (percentage > 50) return 'text-green-600 dark:text-green-400';
    if (percentage > 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const handlePasswordSubmit = async (password) => {
    if (password === quiz.password) {
      setIsPasswordVerified(true);
      setShowPasswordModal(false);
      setShowStudentForm(true);
      toast.success('Password verified! Loading full quiz...');
      
      // Re-fetch the full quiz data with questions using the provided handler
      if (onPasswordVerified) {
        await onPasswordVerified(quiz._id, password);
      }
    } else {
      throw new Error('Incorrect password. Please try again.');
    }
  };

  const handleStudentInfoSubmit = (e) => {
    e.preventDefault();
    if (!studentInfo.studentId.trim() || !studentInfo.studentName.trim()) {
      toast.error('Please enter both student ID and name');
      return;
    }
    setShowStudentForm(false);
    setStartTime(new Date());
  };

  const handleAnswerChange = (questionIndex, answer) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const handleNavigation = (direction) => {
    if (!quiz?.questions) return;
    
    if (direction === 'next' && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (direction === 'prev' && currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleQuestionJump = (questionIndex) => {
    setCurrentQuestion(questionIndex);
  };

  const getAnsweredQuestionsCount = () => {
    return answers.filter(answer => answer.trim() !== '').length;
  };

  const handleAutoSubmit = () => {
    toast.error('Time\'s up! Quiz will be submitted automatically.');
    setTimeout(() => {
      handleSubmit();
    }, 2000);
  };

  const handleSubmit = async () => {
    if (!startTime || !quiz?.questions) return;

    const unansweredCount = quiz.questions.length - getAnsweredQuestionsCount();
    if (unansweredCount > 0) {
      const confirmed = confirm(
        `You have ${unansweredCount} unanswered questions. Are you sure you want to submit?`
      );
      if (!confirmed) return;
    }

    setIsLoading(true);
    try {
      const timeSpent = Math.floor((new Date() - startTime) / 1000); // in seconds
      
      const submissionData = {
        quizId: quiz._id,
        answers,
        studentId: studentInfo.studentId,
        studentName: studentInfo.studentName,
        timeSpent,
        password: quiz.password || null
      };

      await onSubmit(submissionData);
      onClose();
    } catch (error) {
      toast.error('Failed to submit quiz');
      console.error('Submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!showStudentForm && !showPasswordModal && getAnsweredQuestionsCount() > 0) {
      const confirmed = confirm('Are you sure you want to exit? Your progress will be lost.');
      if (!confirmed) return;
    }
    
    setAnswers([]);
    setCurrentQuestion(0);
    setTimeRemaining(0);
    setStudentInfo({ studentId: '', studentName: '' });
    setShowStudentForm(true);
    setShowPasswordModal(false);
    setIsPasswordVerified(false);
    setStartTime(null);
    onClose();
  };

  if (!quiz || !quiz.questions || quiz.questions.length === 0) return null;

  const currentQuestionData = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                
                {/* Student Information Form */}
                {showStudentForm && (
                  <div className="p-8">
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {quiz.quizName}
                      </h2>
                      {quiz.description && (
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {quiz.description}
                        </p>
                      )}
                      <div className="flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {quiz.timeLimit} minutes
                        </div>
                        <div>
                          {quiz.totalQuestions} questions
                        </div>
                        <div>
                          {quiz.totalPoints} points
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleStudentInfoSubmit} className="max-w-md mx-auto space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Student ID *
                        </label>
                        <input
                          type="text"
                          value={studentInfo.studentId}
                          onChange={(e) => setStudentInfo({ ...studentInfo, studentId: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Enter your student ID"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={studentInfo.studentName}
                          onChange={(e) => setStudentInfo({ ...studentInfo, studentName: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>

                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-yellow-800 dark:text-yellow-200">
                            <p className="font-medium mb-1">Important Instructions:</p>
                            <ul className="list-disc list-inside space-y-1">
                              <li>You have {quiz.timeLimit} minutes to complete this quiz</li>
                              <li>Make sure you have a stable internet connection</li>
                              <li>Do not refresh or close this page during the quiz</li>
                              {!quiz.allowRetakes && <li>You can only take this quiz once</li>}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                        >
                          Start Quiz
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Quiz Interface */}
                {!showStudentForm && (
                  <>
                    {/* Header */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {quiz.quizName}
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {studentInfo.studentName} ({studentInfo.studentId})
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className={`flex items-center text-lg font-mono ${getTimeColor()}`}>
                            <ClockIcon className="h-5 w-5 mr-2" />
                            {formatTime(timeRemaining)}
                          </div>
                          
                          <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <XMarkIcon className="h-6 w-6" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
                          <span>{getAnsweredQuestionsCount()} answered</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="flex-1 p-6">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentQuestion}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          {currentQuestionData && (
                            <>
                              <div className="mb-6">
                                <div className="flex justify-between items-start mb-4">
                                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                    Question {currentQuestion + 1}
                                  </h3>
                                  <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {currentQuestionData.points} point{currentQuestionData.points !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                                  {currentQuestionData.question}
                                </p>
                              </div>

                              <div className="space-y-3">
                                {currentQuestionData.options.map((option, optionIndex) => (
                                  <label
                                    key={optionIndex}
                                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                      answers[currentQuestion] === option
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`question_${currentQuestion}`}
                                      value={option}
                                      checked={answers[currentQuestion] === option}
                                      onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 mr-4"
                                    />
                                    <span className="text-gray-900 dark:text-white flex-1">
                                      {option}
                                    </span>
                                    {answers[currentQuestion] === option && (
                                      <CheckCircleIcon className="h-5 w-5 text-indigo-600" />
                                    )}
                                  </label>
                                ))}
                              </div>
                            </>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Question Navigator */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex justify-center mb-4">
                        <div className="flex flex-wrap gap-2 max-w-2xl">
                          {quiz.questions.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => handleQuestionJump(index)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                index === currentQuestion
                                  ? 'bg-indigo-600 text-white'
                                  : answers[index]
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Navigation Controls */}
                      <div className="flex justify-between items-center">
                        <button
                          onClick={() => handleNavigation('prev')}
                          disabled={currentQuestion === 0}
                          className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeftIcon className="h-4 w-4 mr-1" />
                          Previous
                        </button>

                        <div className="flex space-x-4">
                          <button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                          >
                            {isLoading && (
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            <span>Submit Quiz</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleNavigation('next')}
                          disabled={currentQuestion === quiz.questions.length - 1}
                          className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                          <ChevronRightIcon className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
      
      {/* Password Prompt Modal */}
      <PasswordPromptModal
        isOpen={showPasswordModal}
        onClose={handleClose}
        onPasswordSubmit={handlePasswordSubmit}
        quizName={quiz?.quizName || 'Quiz'}
      />
    </Transition>
  );
}