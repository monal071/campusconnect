import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserGroupIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function QuizAnalytics({ quizId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // all, week, month

  useEffect(() => {
    fetchAnalytics();
  }, [quizId, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quiz/${quizId}/analytics?range=${timeRange}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-gray-500">
        No analytics data available yet
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Attempts',
      value: analytics.totalAttempts,
      icon: UserGroupIcon,
      color: 'blue',
      change: analytics.attemptsChange,
    },
    {
      label: 'Average Score',
      value: `${analytics.averageScore}%`,
      icon: TrophyIcon,
      color: 'green',
      change: analytics.scoreChange,
    },
    {
      label: 'Pass Rate',
      value: `${analytics.passRate}%`,
      icon: CheckCircleIcon,
      color: 'purple',
      change: analytics.passRateChange,
    },
    {
      label: 'Avg. Time',
      value: `${Math.round(analytics.averageTime)} min`,
      icon: ClockIcon,
      color: 'orange',
      change: analytics.timeChange,
    },
  ];

  // Score distribution chart data
  const scoreDistributionData = {
    labels: ['0-20%', '21-40%', '41-60%', '61-80%', '81-100%'],
    datasets: [
      {
        label: 'Students',
        data: analytics.scoreDistribution,
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(250, 204, 21, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
      },
    ],
  };

  // Performance trend chart data
  const performanceTrendData = {
    labels: analytics.trendDates,
    datasets: [
      {
        label: 'Average Score',
        data: analytics.trendScores,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  // Question difficulty chart data
  const questionDifficultyData = {
    labels: analytics.questions.map((q, i) => `Q${i + 1}`),
    datasets: [
      {
        label: 'Success Rate (%)',
        data: analytics.questions.map(q => q.successRate),
        backgroundColor: analytics.questions.map(q => 
          q.successRate >= 70 ? 'rgba(34, 197, 94, 0.8)' :
          q.successRate >= 40 ? 'rgba(250, 204, 21, 0.8)' :
          'rgba(239, 68, 68, 0.8)'
        ),
      },
    ],
  };

  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quiz Analytics
        </h2>
        <div className="flex gap-2">
          {['all', 'week', 'month'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {range === 'all' ? 'All Time' : range === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change >= 0;
          const TrendIcon = isPositive ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${colorClasses[stat.color]} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
                {stat.change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${
                    isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Score Distribution
          </h3>
          <Bar
            data={scoreDistributionData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { color: '#9ca3af' },
                },
                x: {
                  ticks: { color: '#9ca3af' },
                },
              },
            }}
          />
        </div>

        {/* Performance Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Performance Trend
          </h3>
          <Line
            data={performanceTrendData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  ticks: { color: '#9ca3af' },
                },
                x: {
                  ticks: { color: '#9ca3af' },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Question Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Question Difficulty Analysis
        </h3>
        <Bar
          data={questionDifficultyData}
          options={{
            responsive: true,
            plugins: {
              legend: { display: false },
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: { color: '#9ca3af' },
              },
              x: {
                ticks: { color: '#9ca3af' },
              },
            },
          }}
        />
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Easy (≥70% success)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Medium (40-69% success)</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Hard (&lt;40% success)</span>
          </div>
        </div>
      </div>

      {/* Detailed Question Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Detailed Question Statistics
        </h3>
        <div className="space-y-4">
          {analytics.questions.map((question, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <span className="font-medium text-gray-900 dark:text-white">
                    Question {index + 1}
                  </span>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {question.text}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  question.successRate >= 70
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : question.successRate >= 40
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {question.successRate}% success
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{question.attempts} attempts</span>
                <span>Avg. time: {question.avgTime}s</span>
                <span>Skipped: {question.skipped} times</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Top Performers
        </h3>
        <div className="space-y-3">
          {analytics.topPerformers?.map((performer, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-sm">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {performer.name}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Completed in {performer.time} minutes
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {performer.score}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact analytics widget for dashboard
export function QuizAnalyticsSummary({ quizId }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const res = await fetch(`/api/quiz/${quizId}/analytics/summary`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    };
    fetchSummary();
  }, [quizId]);

  if (!summary) return null;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {summary.attempts}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Attempts</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
          {summary.avgScore}%
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Avg Score</div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {summary.passRate}%
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">Pass Rate</div>
      </div>
    </div>
  );
}
