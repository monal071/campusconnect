import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  TagIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

export default function QuestionBankModal({ isOpen, onClose, onSelectQuestions }) {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  useState(() => {
    if (isOpen) {
      fetchQuestions();
    }
  }, [isOpen]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quiz/question-bank');
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching question bank:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionId)) {
        return prev.filter(id => id !== questionId);
      }
      return [...prev, questionId];
    });
  };

  const handleAdd = () => {
    const selected = questions.filter(q => selectedQuestions.includes(q._id));
    onSelectQuestions(selected);
    setSelectedQuestions([]);
    onClose();
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || q.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categories = [...new Set(questions.map(q => q.category))];
  const difficulties = ['easy', 'medium', 'hard'];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                  <AcademicCapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Question Bank
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedQuestions.length} questions selected
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-2xl text-gray-500">×</span>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Difficulties</option>
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Questions List */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <AcademicCapIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || filterCategory !== 'all' || filterDifficulty !== 'all'
                    ? 'No questions match your filters'
                    : 'No questions in bank yet. Create some first!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredQuestions.map((question, index) => (
                  <motion.div
                    key={question._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => toggleQuestion(question._id)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedQuestions.includes(question._id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(question._id)}
                        onChange={() => {}}
                        className="mt-1 w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">
                          {question.question}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {question.options?.map((option, idx) => (
                            <span
                              key={idx}
                              className={`text-sm px-2 py-1 rounded ${
                                idx === question.correctAnswer
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}. {option}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                            {question.category}
                          </span>
                          <span className={`px-2 py-1 rounded ${
                            question.difficulty === 'easy'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : question.difficulty === 'medium'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                          }`}>
                            {question.difficulty}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {question.points || 1} {question.points === 1 ? 'point' : 'points'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedQuestions.length} of {filteredQuestions.length} questions selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={selectedQuestions.length === 0}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add {selectedQuestions.length} Question{selectedQuestions.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Save to Question Bank Component
export function SaveToQuestionBankButton({ question, onSaved }) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/quiz/question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question),
      });

      if (res.ok) {
        onSaved?.();
        // Show toast notification
        if (window.customToast) {
          window.customToast.success('Question saved to bank!');
        }
      }
    } catch (error) {
      console.error('Error saving question:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={saving}
      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors"
    >
      <FolderIcon className="w-4 h-4" />
      {saving ? 'Saving...' : 'Save to Bank'}
    </button>
  );
}
