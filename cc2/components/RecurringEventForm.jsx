import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const RECURRENCE_TYPES = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  CUSTOM: 'custom',
};

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export default function RecurringEventForm({ value = {}, onChange }) {
  const [recurrence, setRecurrence] = useState({
    type: value.type || RECURRENCE_TYPES.NONE,
    interval: value.interval || 1,
    daysOfWeek: value.daysOfWeek || [],
    dayOfMonth: value.dayOfMonth || 1,
    endDate: value.endDate || null,
    endAfterOccurrences: value.endAfterOccurrences || null,
    ...value,
  });

  const handleUpdate = (updates) => {
    const newRecurrence = { ...recurrence, ...updates };
    setRecurrence(newRecurrence);
    onChange?.(newRecurrence);
  };

  const toggleDayOfWeek = (day) => {
    const days = recurrence.daysOfWeek || [];
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day].sort();
    handleUpdate({ daysOfWeek: newDays });
  };

  const getRecurrenceDescription = () => {
    if (recurrence.type === RECURRENCE_TYPES.NONE) {
      return 'Does not repeat';
    }

    let description = '';

    // Base frequency
    if (recurrence.interval === 1) {
      description = recurrence.type.charAt(0).toUpperCase() + recurrence.type.slice(1);
    } else {
      description = `Every ${recurrence.interval} ${recurrence.type === 'daily' ? 'days' : 
                     recurrence.type === 'weekly' ? 'weeks' : 
                     recurrence.type === 'monthly' ? 'months' : 'years'}`;
    }

    // Weekly specific days
    if (recurrence.type === RECURRENCE_TYPES.WEEKLY && recurrence.daysOfWeek?.length > 0) {
      const dayNames = recurrence.daysOfWeek.map(d => 
        DAYS_OF_WEEK.find(day => day.value === d)?.label
      ).join(', ');
      description += ` on ${dayNames}`;
    }

    // Monthly specific day
    if (recurrence.type === RECURRENCE_TYPES.MONTHLY && recurrence.dayOfMonth) {
      description += ` on day ${recurrence.dayOfMonth}`;
    }

    // End condition
    if (recurrence.endDate) {
      const date = new Date(recurrence.endDate).toLocaleDateString();
      description += ` until ${date}`;
    } else if (recurrence.endAfterOccurrences) {
      description += ` for ${recurrence.endAfterOccurrences} occurrences`;
    }

    return description;
  };

  return (
    <div className="space-y-4">
      {/* Recurrence Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Repeat
        </label>
        <select
          value={recurrence.type}
          onChange={(e) => handleUpdate({ type: e.target.value })}
          className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        >
          <option value={RECURRENCE_TYPES.NONE}>Does not repeat</option>
          <option value={RECURRENCE_TYPES.DAILY}>Daily</option>
          <option value={RECURRENCE_TYPES.WEEKLY}>Weekly</option>
          <option value={RECURRENCE_TYPES.MONTHLY}>Monthly</option>
          <option value={RECURRENCE_TYPES.YEARLY}>Yearly</option>
        </select>
      </div>

      {/* Additional Options (shown when recurring) */}
      {recurrence.type !== RECURRENCE_TYPES.NONE && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
          {/* Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repeat every
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="365"
                value={recurrence.interval}
                onChange={(e) => handleUpdate({ interval: parseInt(e.target.value) || 1 })}
                className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {recurrence.type === 'daily' ? 'day(s)' : 
                 recurrence.type === 'weekly' ? 'week(s)' : 
                 recurrence.type === 'monthly' ? 'month(s)' : 'year(s)'}
              </span>
            </div>
          </div>

          {/* Weekly: Days of Week */}
          {recurrence.type === RECURRENCE_TYPES.WEEKLY && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repeat on
              </label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                      recurrence.daysOfWeek?.includes(day.value)
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly: Day of Month */}
          {recurrence.type === RECURRENCE_TYPES.MONTHLY && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Day of month
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={recurrence.dayOfMonth}
                onChange={(e) => handleUpdate({ dayOfMonth: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
            </div>
          )}

          {/* End Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ends
            </label>
            <div className="space-y-3">
              {/* Never */}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!recurrence.endDate && !recurrence.endAfterOccurrences}
                  onChange={() => handleUpdate({ endDate: null, endAfterOccurrences: null })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Never</span>
              </label>

              {/* On Date */}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!!recurrence.endDate}
                  onChange={() => handleUpdate({ 
                    endDate: new Date().toISOString().split('T')[0],
                    endAfterOccurrences: null 
                  })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">On</span>
                <input
                  type="date"
                  value={recurrence.endDate || ''}
                  onChange={(e) => handleUpdate({ 
                    endDate: e.target.value,
                    endAfterOccurrences: null 
                  })}
                  disabled={!recurrence.endDate}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </label>

              {/* After N Occurrences */}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="endCondition"
                  checked={!!recurrence.endAfterOccurrences}
                  onChange={() => handleUpdate({ 
                    endAfterOccurrences: 10,
                    endDate: null 
                  })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">After</span>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={recurrence.endAfterOccurrences || ''}
                  onChange={(e) => handleUpdate({ 
                    endAfterOccurrences: parseInt(e.target.value) || null,
                    endDate: null 
                  })}
                  disabled={!recurrence.endAfterOccurrences}
                  className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white disabled:opacity-50"
                />
                <span className="text-gray-700 dark:text-gray-300">occurrences</span>
              </label>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <ArrowPathIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
            Recurrence Pattern
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            {getRecurrenceDescription()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate recurring event instances
export function generateRecurringInstances(baseEvent, recurrence, startDate, endDate) {
  if (!recurrence || recurrence.type === RECURRENCE_TYPES.NONE) {
    return [baseEvent];
  }

  const instances = [];
  let currentDate = new Date(startDate);
  const finalEndDate = endDate ? new Date(endDate) : null;
  let occurrenceCount = 0;
  const maxOccurrences = recurrence.endAfterOccurrences || 365; // Safety limit

  while (occurrenceCount < maxOccurrences) {
    // Check if we've passed the end date
    if (finalEndDate && currentDate > finalEndDate) {
      break;
    }

    // Check if we've reached max occurrences
    if (recurrence.endAfterOccurrences && occurrenceCount >= recurrence.endAfterOccurrences) {
      break;
    }

    // Add instance if it matches the recurrence pattern
    if (matchesRecurrencePattern(currentDate, recurrence)) {
      instances.push({
        ...baseEvent,
        date: new Date(currentDate),
        isRecurring: true,
        recurrenceId: baseEvent._id,
        instanceDate: new Date(currentDate),
      });
      occurrenceCount++;
    }

    // Move to next potential date
    currentDate = getNextDate(currentDate, recurrence);
  }

  return instances;
}

function matchesRecurrencePattern(date, recurrence) {
  switch (recurrence.type) {
    case RECURRENCE_TYPES.WEEKLY:
      return !recurrence.daysOfWeek?.length || recurrence.daysOfWeek.includes(date.getDay());
    case RECURRENCE_TYPES.MONTHLY:
      return !recurrence.dayOfMonth || date.getDate() === recurrence.dayOfMonth;
    default:
      return true;
  }
}

function getNextDate(currentDate, recurrence) {
  const next = new Date(currentDate);
  const interval = recurrence.interval || 1;

  switch (recurrence.type) {
    case RECURRENCE_TYPES.DAILY:
      next.setDate(next.getDate() + interval);
      break;
    case RECURRENCE_TYPES.WEEKLY:
      next.setDate(next.getDate() + (7 * interval));
      break;
    case RECURRENCE_TYPES.MONTHLY:
      next.setMonth(next.getMonth() + interval);
      break;
    case RECURRENCE_TYPES.YEARLY:
      next.setFullYear(next.getFullYear() + interval);
      break;
  }

  return next;
}
