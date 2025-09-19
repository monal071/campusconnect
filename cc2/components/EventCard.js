import { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarIcon, MapPinIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

import { useEffect } from 'react';
export default function EventCard({ event, isAuthenticated, userId }) {
  // Safety check for event prop
  if (!event || typeof event !== 'object') {
    return (
      <div className="card p-4 mb-4 bg-gray-100 dark:bg-gray-800">
        <p className="text-gray-500 dark:text-gray-400">Invalid event data</p>
      </div>
    );
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [joinedCount, setJoinedCount] = useState(Array.isArray(event.joined) ? event.joined.length : 0);
  const [hasJoined, setHasJoined] = useState(Array.isArray(event.joined) && userId ? event.joined.includes(userId) : false);
  useEffect(() => {
    // Skip polling if event ID is not available
    if (!event._id) return;
    
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
    if (!userId || !event._id) return;
    try {
      const res = await fetch('/api/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event._id, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setHasJoined(true);
        setJoinedCount(data.joinedCount || joinedCount + 1);
      }
    } catch (error) {
      console.error('Error joining event:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return format(date, 'PPP p'); // Example: April 29, 2024, 9:00 AM
    } catch (error) {
      return dateString || 'Date TBD';
    }
  };

  const isUpcoming = (dateString) => {
    if (!dateString) return false;
    try {
      const eventDate = new Date(dateString);
      return eventDate > new Date() && !isNaN(eventDate.getTime());
    } catch {
      return false;
    }
  };

  const getEventTypeColor = (type) => {
    if (!type) return 'bg-gray-500/10 text-gray-400';
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

  const getBadgeClass = (type) => {
    if (!type) return 'badge-slate';
    switch (type.toLowerCase()) {
      case 'conference':
        return 'badge-purple';
      case 'workshop':
        return 'badge-blue';
      case 'networking':
        return 'badge-green';
      default:
        return 'badge-slate';
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
          <span className={`badge ${getBadgeClass(event.type)}`}>
            {event.type || 'Event'}
          </span>
          {event.date && isUpcoming(event.date) && (
            <span className="badge badge-success">
              Upcoming
            </span>
          )}
        </div>

        {/* Event Title */}
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{event.title || 'Untitled Event'}</h3>

        {/* Event Description */}
        <p className={`text-slate-600 dark:text-slate-400 ${isExpanded ? '' : 'line-clamp-2'}`}>
          {event.description || 'No description available.'}
        </p>


        {/* Event Details */}
        <div className="space-y-2">
          {event.date && (
            <div className="flex items-center text-slate-500 dark:text-slate-400">
              <CalendarIcon className="h-5 w-5 mr-2" />
              <span>{formatDate(event.date)}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center text-slate-500 dark:text-slate-400">
              <MapPinIcon className="h-5 w-5 mr-2" />
              <span>{event.location}</span>
            </div>
          )}
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