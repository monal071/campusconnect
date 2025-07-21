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
      className="card p-4 mb-4 animate-fade-in cursor-pointer hover:shadow-md transition-shadow duration-300"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex flex-col space-y-4">
        {/* Event Type Badge */}
        <div className="flex justify-between items-start">
          <span className={`badge ${
            event.type.toLowerCase() === 'conference' ? 'badge-purple' :
            event.type.toLowerCase() === 'workshop' ? 'badge-blue' :
            event.type.toLowerCase() === 'networking' ? 'badge-green' : 'badge-slate'
          }`}>
            {event.type}
          </span>
          {isUpcoming(event.date) && (
            <span className="badge badge-success">
              Upcoming
            </span>
          )}
        </div>

        {/* Event Title */}
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{event.title}</h3>

        {/* Event Description */}
        <p className={`text-slate-600 dark:text-slate-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
          {event.description}
        </p>


        {/* Event Details */}
        <div className="space-y-2">
          <div className="flex items-center text-slate-500 dark:text-slate-400">
            <CalendarIcon className="h-5 w-5 mr-2" />
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center text-slate-500 dark:text-slate-400">
            <MapPinIcon className="h-5 w-5 mr-2" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center text-slate-500 dark:text-slate-400">
            <UserGroupIcon className="h-5 w-5 mr-2" />
            <span>Joined: <span className="font-medium text-slate-700 dark:text-slate-300">{joinedCount}</span></span>
          </div>
          {event.maxAttendees && (
            <div className="flex items-center text-slate-500 dark:text-slate-400">
              <span>Max Attendees: <span className="font-medium text-slate-700 dark:text-slate-300">{event.maxAttendees}</span></span>
            </div>
          )}
          {event.registrationDeadline && (
            <div className="flex items-center text-slate-500 dark:text-slate-400">
              <ClockIcon className="h-5 w-5 mr-2" />
              <span>Registration Deadline: {formatDate(event.registrationDeadline)}</span>
            </div>
          )}
          <div className="flex justify-end">
            {isAuthenticated && !hasJoined && (
              <button
                className="btn btn-success btn-sm hover-lift"
                onClick={handleJoin}
              >
                Join Event
              </button>
            )}
            {isAuthenticated && hasJoined && (
              <span className="badge badge-success">Joined</span>
            )}
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 space-y-4 animate-fade-in"
          >
            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="badge badge-blue"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Organizer Info */}
            {event.organizer && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                <h4 className="text-slate-800 dark:text-white font-medium mb-2">Organizer</h4>
                <div className="text-slate-600 dark:text-slate-400">
                  <p>{event.organizer.name}</p>
                  <p>{event.organizer.contact}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
} 