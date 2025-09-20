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
  const [facultyQuizzes, setFacultyQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [quizPassword, setQuizPassword] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [answers, setAnswers] = useState([]);
  const [marks, setMarks] = useState(null);
  const [quizForm, setQuizForm] = useState({
    quizName: '',
    questions: [{ question: '', options: ['', '', '', ''], correct: '' }]
  });
  const [quizPasswordCreated, setQuizPasswordCreated] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    if (session.user.role === 'faculty') {
      fetchFacultyQuizzes();
    }
  }, [session, status]);

  // Faculty: fetch quizzes they created
  const fetchFacultyQuizzes = async () => {
    setLoading(true);
    const res = await fetch('/api/quiz/list');
    const data = await res.json();
    setFacultyQuizzes(data.quizzes || []);
    setLoading(false);
  };

  // Faculty: create quiz
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/quiz/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quizForm)
    });
    const data = await res.json();
    setQuizPasswordCreated(data.password);
    setLoading(false);
    fetchFacultyQuizzes();
  };

  // Faculty: view results
  const handleViewResults = async (quizId) => {
    setLoading(true);
    const res = await fetch(`/api/quiz/results?quizId=${quizId}`);
    const data = await res.json();
    setResults(data.submissions || []);
    setLoading(false);
  };

  // Student: get quiz by password
  const handleGetQuiz = async () => {
    if (!quizPassword.trim()) return alert('Enter quiz password');
    setLoading(true);
    const res = await fetch(`/api/quiz/get?password=${quizPassword}`);
    const data = await res.json();
    if (res.ok) {
      setCurrentQuiz(data.quiz);
      setAnswers(new Array(data.quiz.questions.length).fill(''));
    } else {
      alert(data.message);
    }
    setLoading(false);
  };

  // Student: submit quiz
  const handleSubmitQuiz = async (e) => {
    e.preventDefault();
    if (!studentId.trim() || !studentName.trim()) return alert('Enter your ID and name');
    setLoading(true);
    const res = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quizId: currentQuiz._id,
        studentId,
        studentName,
        answers
      })
    });
    const data = await res.json();
    setMarks(data.marks);
    setLoading(false);
  };

  // UI rendering
  if (status === 'loading') return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  if (!session) return null;
  if (session.user.role === 'admin') return <div className="max-w-3xl mx-auto p-8 text-center"><div className="text-lg text-gray-600 dark:text-gray-400">Admins do not have quiz access.</div></div>;

  // Faculty dashboard
  if (session.user.role === 'faculty') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Faculty Quiz Dashboard</h1>
        <button className="mb-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors" onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? 'Hide Quiz Creator' : 'Create New Quiz'}
        </button>
        {showCreateForm && (
          <form onSubmit={handleCreateQuiz} className="mb-8 p-6 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-md">
            <label className="block mb-2 font-semibold text-gray-800 dark:text-gray-200">Quiz Name</label>
            <input 
              value={quizForm.quizName} 
              onChange={e => setQuizForm({ ...quizForm, quizName: e.target.value })} 
              className="mb-4 p-3 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-colors" 
              placeholder="Enter quiz name (e.g., Math Quiz)"
              required 
            />
            {quizForm.questions.map((q, idx) => (
              <div key={idx} className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <label className="block mb-2 font-semibold text-gray-800 dark:text-gray-200">Question {idx + 1}</label>
                <input 
                  value={q.question} 
                  onChange={e => {
                    const updated = [...quizForm.questions];
                    updated[idx].question = e.target.value;
                    setQuizForm({ ...quizForm, questions: updated });
                  }} 
                  className="mb-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-colors" 
                  placeholder="Enter your question here"
                  required 
                />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {q.options.map((opt, oIdx) => (
                    <input 
                      key={oIdx} 
                      value={opt} 
                      onChange={e => {
                        const updated = [...quizForm.questions];
                        updated[idx].options[oIdx] = e.target.value;
                        setQuizForm({ ...quizForm, questions: updated });
                      }} 
                      className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-colors" 
                      placeholder={`Option ${oIdx + 1}`} 
                      required 
                    />
                  ))}
                </div>
                <label className="block mb-2 font-semibold text-gray-800 dark:text-gray-200">Correct Option (enter exact option text)</label>
                <input 
                  value={q.correct} 
                  onChange={e => {
                    const updated = [...quizForm.questions];
                    updated[idx].correct = e.target.value;
                    setQuizForm({ ...quizForm, questions: updated });
                  }} 
                  className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-colors" 
                  placeholder="Enter the correct option text exactly as written above"
                  required 
                />
              </div>
            ))}
            <div className="flex gap-3">
              <button type="button" className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors" onClick={() => setQuizForm({ ...quizForm, questions: [...quizForm.questions, { question: '', options: ['', '', '', ''], correct: '' }] })}>Add Question</button>
              <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors" disabled={loading}>
                {loading ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </form>
        )}
        {quizPasswordCreated && (
          <div className="mb-6 p-4 bg-yellow-100 border rounded">
            <strong>Quiz Password:</strong> <span className="font-mono text-lg">{quizPasswordCreated}</span>
            <div className="text-xs text-gray-600">Share this password with students to allow them to take the quiz.</div>
          </div>
        )}
        <h2 className="text-xl font-semibold mb-2">Your Quizzes</h2>
        {loading ? <div>Loading...</div> : (
          <ul className="mb-8">
            {facultyQuizzes.map(q => (
              <li key={q._id} className="mb-2 p-3 border rounded bg-white flex justify-between items-center">
                <span>{q.quizName}</span>
                <button className="px-3 py-1 bg-indigo-500 text-white rounded" onClick={() => handleViewResults(q._id)}>View Results</button>
              </li>
            ))}
          </ul>
        )}
        {results.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2">Quiz Results</h3>
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1">Student Name</th>
                  <th className="border px-2 py-1">Student ID</th>
                  <th className="border px-2 py-1">Marks</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{r.studentName}</td>
                    <td className="border px-2 py-1">{r.studentId}</td>
                    <td className="border px-2 py-1">{r.marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </Layout>
    );
  }

  // Student quiz page
  if (session.user.role === 'student') {
    return (
      <div className="max-w-xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Student Quiz Page</h1>
        {!currentQuiz ? (
          <div className="mb-6">
            <label className="block mb-2 font-semibold">Enter Quiz Password</label>
            <input value={quizPassword} onChange={e => setQuizPassword(e.target.value)} className="mb-4 p-2 border rounded w-full" />
            <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={handleGetQuiz}>Get Quiz</button>
          </div>
        ) : marks === null ? (
          <form onSubmit={handleSubmitQuiz} className="mb-8 p-4 border rounded bg-gray-50">
            <label className="block mb-2 font-semibold">Your Name</label>
            <input value={studentName} onChange={e => setStudentName(e.target.value)} className="mb-4 p-2 border rounded w-full" required />
            <label className="block mb-2 font-semibold">Your ID</label>
            <input value={studentId} onChange={e => setStudentId(e.target.value)} className="mb-4 p-2 border rounded w-full" required />
            <h2 className="text-lg font-bold mb-4">{currentQuiz.quizName}</h2>
            {currentQuiz.questions.map((q, idx) => (
              <div key={idx} className="mb-4">
                <label className="block mb-1">Q{idx + 1}: {q.question}</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {q.options.map((opt, oIdx) => (
                    <label key={oIdx} className="flex items-center">
                      <input type="radio" name={`q${idx}`} value={opt} checked={answers[idx] === opt} onChange={() => {
                        const updated = [...answers];
                        updated[idx] = opt;
                        setAnswers(updated);
                      }} className="mr-2" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded">Submit Quiz</button>
          </form>
        ) : (
          <div className="p-4 bg-green-100 border rounded">
            <h2 className="text-lg font-bold mb-2">Quiz Submitted!</h2>
            <div className="mb-2">Your Marks: <span className="font-mono text-lg">{marks}</span></div>
          </div>
        )}
      </div>
    );
  }

  return null;
}