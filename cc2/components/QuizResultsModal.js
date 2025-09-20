import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { 
  XMarkIcon, 
  ChartBarIcon, 
  UserIcon,
  ClockIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  DownloadIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function QuizResultsModal({ isOpen, onClose, quiz }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'submissions', 'analytics'
  const [sortBy, setSortBy] = useState('score'); // 'score', 'time', 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  useEffect(() => {
    if (isOpen && quiz) {
      fetchResults();
    }
  }, [isOpen, quiz]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quiz/results?quizId=${quiz._id}`);
      const data = await response.json();
      
      if (response.ok) {
        setResults(data.results?.submissions || []);
      } else {
        toast.error(data.message || 'Failed to fetch results');
      }
    } catch (error) {
      toast.error('Error fetching quiz results');
      console.error('Results fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600 dark:text-green-400';
      case 'B': return 'text-blue-600 dark:text-blue-400';
      case 'C': return 'text-yellow-600 dark:text-yellow-400';
      case 'D': return 'text-orange-600 dark:text-orange-400';
      case 'F': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const calculateStats = () => {
    if (results.length === 0) return null;

    const scores = results.map(r => r.percentage);
    const times = results.map(r => r.timeSpent);
    
    return {
      totalSubmissions: results.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      averageTime: Math.round(times.reduce((a, b) => a + b, 0) / times.length),
      gradeDistribution: {
        A: results.filter(r => r.grade === 'A').length,
        B: results.filter(r => r.grade === 'B').length,
        C: results.filter(r => r.grade === 'C').length,
        D: results.filter(r => r.grade === 'D').length,
        F: results.filter(r => r.grade === 'F').length,
      }
    };
  };

  const sortedResults = [...results].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'score':
        aValue = a.percentage;
        bValue = b.percentage;
        break;
      case 'time':
        aValue = a.timeSpent;
        bValue = b.timeSpent;
        break;
      case 'name':
        aValue = a.studentName.toLowerCase();
        bValue = b.studentName.toLowerCase();
        break;
      default:
        aValue = a.submittedAt;
        bValue = b.submittedAt;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const exportResults = () => {
    const csvContent = [
      ['Student Name', 'Student ID', 'Score', 'Percentage', 'Grade', 'Time Spent', 'Submitted At'],
      ...results.map(result => [
        result.studentName,
        result.studentId,
        `${result.score}/${result.totalQuestions}`,
        `${result.percentage}%`,
        result.grade,
        formatTime(result.timeSpent),
        formatDate(result.submittedAt)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${quiz.quizName}_results.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Results exported successfully');
  };

  const stats = calculateStats();

  const renderOverview = () => (
    <div className="space-y-6">
      {stats && (
        <>
          {/* Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <UserIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalSubmissions}</p>
                  <p className="text-sm text-blue-600/80">Submissions</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.averageScore}%</p>
                  <p className="text-sm text-green-600/80">Average</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <AcademicCapIcon className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-purple-600">{stats.highestScore}%</p>
                  <p className="text-sm text-purple-600/80">Highest</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold text-orange-600">{formatTime(stats.averageTime)}</p>
                  <p className="text-sm text-orange-600/80">Avg Time</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Grade Distribution</h3>
            <div className="space-y-3">
              {Object.entries(stats.gradeDistribution).map(([grade, count]) => {
                const percentage = stats.totalSubmissions > 0 ? (count / stats.totalSubmissions) * 100 : 0;
                return (
                  <div key={grade} className="flex items-center">
                    <div className="w-8 text-center">
                      <span className={`font-bold ${getGradeColor(grade)}`}>{grade}</span>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            grade === 'A' ? 'bg-green-500' : 
                            grade === 'B' ? 'bg-blue-500' : 
                            grade === 'C' ? 'bg-yellow-500' : 
                            grade === 'D' ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm text-gray-600 dark:text-gray-400">
                      {count} ({Math.round(percentage)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderSubmissions = () => (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="score">Sort by Score</option>
            <option value="name">Sort by Name</option>
            <option value="time">Sort by Time</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
        
        <button
          onClick={exportResults}
          className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <DownloadIcon className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Submissions List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedResults.map((result, index) => (
          <motion.div
            key={result.userId + '_' + result.studentId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all cursor-pointer"
            onClick={() => setSelectedSubmission(result)}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">{result.studentName}</h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">({result.studentId})</span>
                  <span className={`text-lg font-bold ${getGradeColor(result.grade)}`}>
                    {result.grade}
                  </span>
                </div>
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span>{result.score}/{result.totalQuestions} correct</span>
                  <span>{result.percentage}%</span>
                  <span>{formatTime(result.timeSpent)}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSubmission(result);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderSubmissionDetail = () => {
    if (!selectedSubmission) return null;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setSelectedSubmission(null)}
            className="text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            ← Back to submissions
          </button>
        </div>

        {/* Student Info */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Student</span>
              <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.studentName}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">ID</span>
              <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.studentId}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Score</span>
              <p className="font-medium text-gray-900 dark:text-white">
                {selectedSubmission.score}/{selectedSubmission.totalQuestions} ({selectedSubmission.percentage}%)
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Grade</span>
              <p className={`font-bold text-xl ${getGradeColor(selectedSubmission.grade)}`}>
                {selectedSubmission.grade}
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {selectedSubmission.detailedResults?.map((result, index) => (
            <div key={result.questionId} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Question {index + 1}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm px-2 py-1 rounded ${
                    result.isCorrect 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {result.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {result.points}/{result.maxPoints} pts
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-3">{result.question}</p>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Student Answer: </span>
                  <span className={result.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {result.studentAnswer || 'No answer'}
                  </span>
                </div>
                
                {!result.isCorrect && (
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Correct Answer: </span>
                    <span className="text-green-600 dark:text-green-400">{result.correctAnswer}</span>
                  </div>
                )}
                
                {result.explanation && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Explanation:</strong> {result.explanation}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!quiz) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                        Quiz Results
                      </Dialog.Title>
                      <p className="text-gray-600 dark:text-gray-400">{quiz.quizName}</p>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Tab Navigation */}
                  {!selectedSubmission && (
                    <div className="flex space-x-4 mt-4">
                      <button
                        onClick={() => setViewMode('overview')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          viewMode === 'overview'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Overview
                      </button>
                      <button
                        onClick={() => setViewMode('submissions')}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          viewMode === 'submissions'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Submissions ({results.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-lg text-gray-600 dark:text-gray-400">Loading results...</div>
                    </div>
                  ) : results.length === 0 ? (
                    <div className="text-center h-64 flex flex-col items-center justify-center">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No submissions yet</p>
                    </div>
                  ) : selectedSubmission ? (
                    renderSubmissionDetail()
                  ) : viewMode === 'overview' ? (
                    renderOverview()
                  ) : (
                    renderSubmissions()
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}