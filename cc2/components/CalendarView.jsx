import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarView({ events = [], onEventClick, onDateClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // month, week, day
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Generate calendar days
  const calendarDays = [];
  
  // Previous month days
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthDays - i),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: true,
      date: new Date(year, month, day),
    });
  }

  // Next month days to fill the grid
  const remainingDays = 42 - calendarDays.length; // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      day,
      isCurrentMonth: false,
      date: new Date(year, month + 1, day),
    });
  }

  // Get events for a specific date
  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {MONTHS[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Today
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* View Switcher */}
          <div className="flex gap-2">
            {['month', 'week', 'day'].map(viewType => (
              <button
                key={viewType}
                onClick={() => setView(viewType)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === viewType
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {viewType.charAt(0).toUpperCase() + viewType.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      {view === 'month' && (
        <div className="p-6">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {DAYS_OF_WEEK.map(day => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((dayInfo, index) => {
              const dayEvents = getEventsForDate(dayInfo.date);
              const isTodayDate = isToday(dayInfo.date);

              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    setSelectedDate(dayInfo.date);
                    onDateClick?.(dayInfo.date);
                  }}
                  className={`relative min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all ${
                    dayInfo.isCurrentMonth
                      ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400'
                  } ${
                    isTodayDate
                      ? 'ring-2 ring-blue-500'
                      : ''
                  }`}
                >
                  {/* Day Number */}
                  <div className={`text-sm font-semibold mb-1 ${
                    isTodayDate
                      ? 'w-6 h-6 flex items-center justify-center rounded-full bg-blue-500 text-white'
                      : dayInfo.isCurrentMonth
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-400'
                  }`}>
                    {dayInfo.day}
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map((event, idx) => (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded truncate hover:bg-blue-200 dark:hover:bg-blue-900/50"
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 px-2">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <WeekView
          currentDate={currentDate}
          events={events}
          onEventClick={onEventClick}
        />
      )}

      {/* Day View */}
      {view === 'day' && (
        <DayView
          currentDate={currentDate}
          events={events}
          onEventClick={onEventClick}
        />
      )}

      {/* Selected Date Events Sidebar */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-2xl p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <span className="text-2xl text-gray-500">×</span>
              </button>
            </div>

            <div className="space-y-4">
              {getEventsForDate(selectedDate).map(event => (
                <EventCard key={event._id} event={event} onClick={onEventClick} />
              ))}

              {getEventsForDate(selectedDate).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No events on this day</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WeekView({ currentDate, events, onEventClick }) {
  // Get week start (Sunday)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });

  return (
    <div className="p-6">
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dayEvents = events.filter(event => {
            const eventDate = new Date(event.date);
            return (
              eventDate.getDate() === day.getDate() &&
              eventDate.getMonth() === day.getMonth() &&
              eventDate.getFullYear() === day.getFullYear()
            );
          });

          const isToday = new Date().toDateString() === day.toDateString();

          return (
            <div key={index} className="space-y-2">
              <div className={`text-center p-2 rounded-lg ${
                isToday ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <div className="text-xs font-medium">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-lg font-bold">
                  {day.getDate()}
                </div>
              </div>

              <div className="space-y-2 min-h-[400px]">
                {dayEvents.map(event => (
                  <div
                    key={event._id}
                    onClick={() => onEventClick?.(event)}
                    className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1 truncate">
                      {event.title}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-400">
                      {new Date(event.date).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayView({ currentDate, events, onEventClick }) {
  const dayEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return (
      eventDate.getDate() === currentDate.getDate() &&
      eventDate.getMonth() === currentDate.getMonth() &&
      eventDate.getFullYear() === currentDate.getFullYear()
    );
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Generate time slots (24 hours)
  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="p-6">
      <div className="space-y-1">
        {timeSlots.map(hour => {
          const hourEvents = dayEvents.filter(event => {
            const eventHour = new Date(event.date).getHours();
            return eventHour === hour;
          });

          return (
            <div key={hour} className="flex gap-4 min-h-[60px]">
              <div className="w-20 text-right text-sm text-gray-600 dark:text-gray-400 pt-1">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700 pt-1">
                {hourEvents.map(event => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onClick={onEventClick}
                    compact
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventCard({ event, onClick, compact = false }) {
  return (
    <div
      onClick={() => onClick?.(event)}
      className={`${
        compact ? 'p-2 mb-1' : 'p-4'
      } bg-blue-100 dark:bg-blue-900/30 rounded-lg cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors`}
    >
      <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
        {event.title}
      </h4>
      <div className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4" />
          {new Date(event.date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          })}
        </div>
        {event.location && (
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4" />
            {event.location}
          </div>
        )}
        {event.attendees && (
          <div className="flex items-center gap-2">
            <UserGroupIcon className="w-4 h-4" />
            {event.attendees} attending
          </div>
        )}
      </div>
    </div>
  );
}
