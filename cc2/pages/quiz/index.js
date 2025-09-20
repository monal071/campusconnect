import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '../../components/Layout';
import { 
  AcademicCapIcon,
  ClockIcon,
  DocumentTextIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function QuizPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [quizPassword, setQuizPassword] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  
  // Quiz creation form state
  const [quizForm, setQuizForm] = useState({
    quizName: '',
    timeLimit: 30,
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role === 'faculty' || session.user.role === 'admin') {
      fetchQuizzes();
    }
  }, [session, status, router]);

  // Timer effect for quiz
  useEffect(() => {
    let interval;
    if (quizStarted && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStarted, timeLeft]);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quiz');
      const data = await response.json();
      if (response.ok) {
        setQuizzes(data.quizzes);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async () => {
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quizForm)
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Quiz created successfully! Password: ${data.password}`);
        setShowCreateForm(false);
        setQuizForm({
          quizName: '',
          timeLimit: 30,
          questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }]
        });
        fetchQuizzes();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Error creating quiz');
    }
  };

  const getQuizByPassword = async () => {
    if (!quizPassword.trim()) {
      alert('Please enter quiz password');
      return;
    }

    try {
      const response = await fetch(`/api/quiz/submit?password=${quizPassword}`);
      const data = await response.json();
      if (response.ok) {
        setCurrentQuiz(data.quiz);
        setAnswers(new Array(data.quiz.questions.length).fill(-1));
        setTimeLeft(data.quiz.timeLimit * 60); // Convert to seconds
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
      alert('Error fetching quiz');
    }
  };

  const startQuiz = () => {
    if (!studentId.trim()) {
      alert('Please enter your Student ID');
      return;
    }
    setQuizStarted(true);
  };

  const handleSubmitQuiz = async () => {
    try {
      const timeTaken = (currentQuiz.timeLimit * 60) - timeLeft;
      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: quizPassword,
          answers,
          studentId,
          timeTaken
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Quiz submitted! Score: ${data.score}% (${data.correctAnswers}/${data.totalQuestions})`);
        // Reset quiz state
        setCurrentQuiz(null);
        setQuizPassword('');
        setStudentId('');
        setAnswers([]);
        setQuizStarted(false);
        setTimeLeft(0);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz');
    }
  };

  const addQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }]
    }));
  };

  const updateQuestion = (index, field, value) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateOption = (qIndex, oIndex, value) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === qIndex ? { 
          ...q, 
          options: q.options.map((opt, j) => j === oIndex ? value : opt)
        } : q
      )
    }));
  };

  const removeQuestion = (index) => {
    if (quizForm.questions.length > 1) {
      setQuizForm(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (status === 'loading') return <div>Loading...</div>;
  if (!session) return null;

  // Admin role has no access to quiz
  if (session.user.role === 'admin') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Quiz System</h1>
            <p className="text-gray-600 dark:text-gray-400">Quiz access is not available for admin role.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Faculty Quiz Dashboard
  if (session.user.role === 'faculty') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Dashboard</h1>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Create Quiz
            </button>
          </div>

          {/* Quiz List */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-3 text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
                No quizzes created yet
              </div>
            ) : (
              quizzes.map((quiz) => (
                <motion.div
                  key={quiz._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700"
                >
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {quiz.quizName}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      {quiz.timeLimit} minutes
                    </div>
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="w-4 h-4" />
                      Password: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {quiz.password}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4" />
                      {quiz.submissions?.length || 0} submissions
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => router.push(`/quiz/results?id=${quiz._id}`)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      <EyeIcon className="w-4 h-4" />
                      Results
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Create Quiz Modal */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={() => setShowCreateForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Quiz</h2>
                      <button
                        onClick={() => setShowCreateForm(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <XMarkIcon className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Quiz Basic Info */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Quiz Name
                          </label>
                          <input
                            type="text"
                            value={quizForm.quizName}
                            onChange={(e) => setQuizForm(prev => ({ ...prev, quizName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="e.g., Math Quiz"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Time Limit (minutes)
                          </label>
                          <input
                            type="number"
                            value={quizForm.timeLimit}
                            onChange={(e) => setQuizForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            min="1"
                          />
                        </div>
                      </div>

                      {/* Questions */}
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Questions</h3>
                          <button
                            onClick={addQuestion}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                          >
                            <PlusIcon className="w-4 h-4" />
                            Add Question
                          </button>
                        </div>

                        {quizForm.questions.map((question, qIndex) => (
                          <div key={qIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
                            <div className="flex justify-between items-start mb-3">
                              <h4 className="font-medium text-gray-900 dark:text-white">Question {qIndex + 1}</h4>
                              {quizForm.questions.length > 1 && (
                                <button
                                  onClick={() => removeQuestion(qIndex)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                            
                            <div className="space-y-3">
                              <textarea
                                value={question.question}
                                onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Enter question"
                                rows="2"
                              />
                              
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name={`correct-${qIndex}`}
                                    checked={question.correctAnswer === oIndex}
                                    onChange={() => updateQuestion(qIndex, 'correctAnswer', oIndex)}
                                    className="text-indigo-600"
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    placeholder={`Option ${oIndex + 1}`}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Create Button */}
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowCreateForm(false)}
                          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={createQuiz}
                          disabled={!quizForm.quizName || quizForm.questions.some(q => !q.question || q.options.some(opt => !opt))}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg"
                        >
                          Create Quiz
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Layout>
    );
  }

  // Student Quiz Interface
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Take Quiz</h1>

        {!currentQuiz ? (
          // Password Entry
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="text-center mb-6">
                <AcademicCapIcon className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Enter Quiz Password</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">Get the password from your instructor</p>
              </div>
              
              <div className="space-y-4">
                <input
                  type="text"
                  value={quizPassword}
                  onChange={(e) => setQuizPassword(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center font-mono text-lg"
                  placeholder="QUIZ PASSWORD"
                  maxLength="8"
                />
                <button
                  onClick={getQuizByPassword}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-lg font-medium"
                >
                  Access Quiz
                </button>
              </div>
            </div>
          </div>
        ) : !quizStarted ? (
          // Quiz Info and Student ID Entry
          <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{currentQuiz.quizName}</h2>
              <div className="space-y-3 mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Instructor:</strong> {currentQuiz.createdByName}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Questions:</strong> {currentQuiz.questions.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Time Limit:</strong> {currentQuiz.timeLimit} minutes
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Student ID
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your student ID"
                  />
                </div>
                <button
                  onClick={startQuiz}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium"
                >
                  Start Quiz
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Quiz Taking Interface
          <div className="max-w-4xl mx-auto">
            {/* Timer */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentQuiz.quizName}</h2>
                <div className="flex items-center gap-2 text-lg font-bold">
                  <ClockIcon className="w-5 h-5" />
                  <span className={timeLeft < 300 ? 'text-red-500' : 'text-gray-900 dark:text-white'}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {currentQuiz.questions.map((question, qIndex) => (
                <div key={qIndex} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {qIndex + 1}. {question.question}
                  </h3>
                  <div className="space-y-2">
                    {question.options.map((option, oIndex) => (
                      <label key={oIndex} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name={`question-${qIndex}`}
                          checked={answers[qIndex] === oIndex}
                          onChange={() => {
                            const newAnswers = [...answers];
                            newAnswers[qIndex] = oIndex;
                            setAnswers(newAnswers);
                          }}
                          className="text-indigo-600"
                        />
                        <span className="text-gray-900 dark:text-white">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="mt-8 text-center">
              <button
                onClick={handleSubmitQuiz}
                className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 rounded-lg font-medium text-lg"
              >
                Submit Quiz
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}