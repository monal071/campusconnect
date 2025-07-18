import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, MapPinIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

import { useEffect } from 'react';
export default function EventCard({ event, isAuthenticated, userId }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [joinedCount, setJoinedCount] = useState(Array.isArray(event.joined) ? event.joined.length : 0);
  const [hasJoined, setHasJoined] = useState(Array.isArray(event.joined) && userId ? event.joined.includes(userId) : false);
  useEffect(() => {
    // Poll for joined count every 5s
    let interval;
    const fetchJoined = async () => {
      try {
        const res = await fetch(`/api/events`);
        const data = await res.json();
        const found = Array.isArray(data) ? data.find(e => e._id === event._id) : Array.isArray(data.data) ? data.data.find(e => e._id === event._id) : null;
        if (found && Array.isArray(found.joined)) {
          setJoinedCount(found.joined.length);
          if (userId) setHasJoined(found.joined.includes(userId));
        }
      } catch {}
    };
    interval = setInterval(fetchJoined, 5000);
    return () => clearInterval(interval);
  }, [event._id, userId]);

  const handleJoin = async (e) => {
    e.stopPropagation();
    if (!userId) return;
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event._id, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setHasJoined(true);
        setJoinedCount(data.joinedCount);
      }
    } catch {}
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP p'); // Example: April 29, 2024, 9:00 AM
    } catch (error) {
      return dateString;
    }
  };

  const isUpcoming = (dateString) => {
    const eventDate = new Date(dateString);
    return eventDate > new Date();
  };

  const getEventTypeColor = (type) => {
    switch (type.toLowerCase()) {
      case 'conference':
        return 'bg-purple-500/10 text-purple-400';
      case 'workshop':
        return 'bg-blue-500/10 text-blue-400';
      case 'networking':
        return 'bg-green-500/10 text-green-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gray-800 rounded-lg p-6 relative group hover:shadow-lg transition-all duration-300"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex flex-col space-y-4">
        {/* Event Type Badge */}
        <div className="flex justify-between items-start">
          <span className={`px-3 py-1 rounded-full text-sm ${getEventTypeColor(event.type)}`}>
            {event.type}
          </span>
          {isUpcoming(event.date) && (
            <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm">
              Upcoming
            </span>
          )}
        </div>

        {/* Event Title */}
        <h3 className="text-xl font-semibold text-white">{event.title}</h3>

        {/* Event Description */}
        <p className={`text-gray-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
          {event.description}
        </p>


        {/* Event Details */}
        <div className="space-y-2">
          <div className="flex items-center text-gray-400">
            <CalendarIcon className="h-5 w-5 mr-2" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center text-gray-400">
            <MapPinIcon className="h-5 w-5 mr-2" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center text-gray-400">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            <span>Joined: {joinedCount}</span>
          </div>
          {event.maxAttendees && (
            <div className="flex items-center text-gray-400">
              <span>Max Attendees: {event.maxAttendees}</span>
            </div>
          )}
          {event.registrationDeadline && (
            <div className="flex items-center text-gray-400">
              <ClockIcon className="h-5 w-5 mr-2" />
              <span>Registration Deadline: {formatDate(event.registrationDeadline)}</span>
            </div>
          )}
          {isAuthenticated && !hasJoined && (
            <button
              className="mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
              onClick={handleJoin}
            >
              Join Event
            </button>
          )}
          {isAuthenticated && hasJoined && (
            <span className="mt-2 px-4 py-2 bg-green-900 text-green-300 rounded-lg shadow">Joined</span>
          )}
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 space-y-4"
          >
            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Organizer Info */}
            {event.organizer && (
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-white font-medium mb-2">Organizer</h4>
                <div className="text-gray-400">
                  <p>{event.organizer.name}</p>
                  <p>{event.organizer.contact}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Expand/Collapse Indicator */}
        <motion.div
          className="absolute bottom-4 right-4 text-gray-400"
          animate={{ rotate: isExpanded ? 180 : 0 }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
} 