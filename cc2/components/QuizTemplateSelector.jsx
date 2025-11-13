import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  ClockIcon,
  QuestionMarkCircleIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const QUIZ_TEMPLATES = [
  {
    id: 'quick-assessment',
    name: 'Quick Assessment',
    description: '5-10 questions, 10 minutes',
    icon: ClockIcon,
    color: 'blue',
    settings: {
      duration: 10,
      questionCount: 5,
      difficulty: 'medium',
      randomize: true,
      showResults: true,
    },
    categories: ['General', 'Review', 'Practice'],
  },
  {
    id: 'midterm-exam',
    name: 'Midterm Exam',
    description: '20-30 questions, 60 minutes',
    icon: AcademicCapIcon,
    color: 'purple',
    settings: {
      duration: 60,
      questionCount: 25,
      difficulty: 'medium',
      randomize: true,
      showResults: false,
      partialCredit: true,
    },
    categories: ['Exam', 'Assessment', 'Graded'],
  },
  {
    id: 'final-exam',
    name: 'Final Exam',
    description: '40-50 questions, 120 minutes',
    icon: DocumentDuplicateIcon,
    color: 'red',
    settings: {
      duration: 120,
      questionCount: 45,
      difficulty: 'hard',
      randomize: true,
      showResults: false,
      partialCredit: true,
    },
    categories: ['Exam', 'Final', 'Comprehensive'],
  },
  {
    id: 'practice-quiz',
    name: 'Practice Quiz',
    description: '10-15 questions, unlimited time',
    icon: QuestionMarkCircleIcon,
    color: 'green',
    settings: {
      duration: 0, // unlimited
      questionCount: 12,
      difficulty: 'easy',
      randomize: false,
      showResults: true,
      showAnswers: true,
    },
    categories: ['Practice', 'Study', 'Self-Paced'],
  },
  {
    id: 'pop-quiz',
    name: 'Pop Quiz',
    description: '3-5 questions, 5 minutes',
    icon: ClockIcon,
    color: 'yellow',
    settings: {
      duration: 5,
      questionCount: 3,
      difficulty: 'easy',
      randomize: false,
      showResults: true,
    },
    categories: ['Quick', 'Review'],
  },
  {
    id: 'survey',
    name: 'Survey/Feedback',
    description: 'No time limit, ungraded',
    icon: CheckCircleIcon,
    color: 'indigo',
    settings: {
      duration: 0,
      questionCount: 10,
      graded: false,
      randomize: false,
      showResults: false,
    },
    categories: ['Survey', 'Feedback'],
  },
];

export default function QuizTemplateSelector({ onSelectTemplate, onClose }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const handleSelect = (template) => {
    setSelectedTemplate(template);
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onClose();
    }
  };

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    indigo: 'from-indigo-500 to-indigo-600',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Choose a Quiz Template
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Start with a pre-configured template or create from scratch
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <span className="text-2xl text-gray-500">×</span>
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUIZ_TEMPLATES.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate?.id === template.id;

              return (
                <motion.div
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(template)}
                  className={`relative p-6 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircleIcon className="w-6 h-6 text-blue-500" />
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[template.color]} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {template.categories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Settings Preview */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Questions:</span>
                      <span className="font-medium">{template.settings.questionCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Duration:</span>
                      <span className="font-medium">
                        {template.settings.duration === 0 ? 'Unlimited' : `${template.settings.duration} min`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Difficulty:</span>
                      <span className="font-medium capitalize">{template.settings.difficulty}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Create from Scratch Option */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onSelectTemplate(null);
                onClose();
              }}
              className="p-6 rounded-xl cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all"
            >
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-4">
                  <span className="text-2xl">➕</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Start from Scratch
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create a custom quiz with your own settings
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedTemplate ? `Selected: ${selectedTemplate.name}` : 'Select a template to continue'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedTemplate}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Use Template
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Hook to use templates
export function useQuizTemplate(templateId) {
  const template = QUIZ_TEMPLATES.find(t => t.id === templateId);
  return template || null;
}

// Export templates for use in other components
export { QUIZ_TEMPLATES };
