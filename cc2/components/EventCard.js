import { useState } from "react";
import {
  CalendarIcon,
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";

export default function EventCard({ event, isAuthenticated, userId }) {
  if (!event || typeof event !== "object") {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-gray-500 dark:text-gray-400">Invalid event data</p>
      </div>
    );
  }

  const [isExpanded, setIsExpanded] = useState(false);
  const [joinedCount, setJoinedCount] = useState(
    Array.isArray(event.joined) ? event.joined.length : 0,
  );
  const [hasJoined, setHasJoined] = useState(
    Array.isArray(event.joined) && userId
      ? event.joined.includes(userId)
      : false,
  );

  const handleJoin = async (e) => {
    e.stopPropagation();
    if (!userId || !event._id) return;
    try {
      const res = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event._id, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setHasJoined(true);
        setJoinedCount(data.joinedCount || joinedCount + 1);
      }
    } catch (error) {
      console.error("Error joining event:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date TBD";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return format(date, "PPP p");
    } catch {
      return dateString || "Date TBD";
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

  const getTypeColor = (type) => {
    if (!type)
      return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    switch (type.toLowerCase()) {
      case "conference":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "workshop":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "networking":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Type badge and status */}
      <div className="flex justify-between items-start mb-3">
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full ${getTypeColor(event.type)}`}
        >
          {event.type || "Event"}
        </span>
        {event.date && isUpcoming(event.date) && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Upcoming
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {event.title || "Untitled Event"}
      </h3>

      {/* Description */}
      <p
        className={`text-sm text-gray-600 dark:text-gray-400 mb-3 ${isExpanded ? "" : "line-clamp-2"}`}
      >
        {event.description || "No description available."}
      </p>

      {/* Details */}
      <div className="space-y-1.5 text-sm">
        {event.date && (
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{formatDate(event.date)}</span>
          </div>
        )}
        {event.location && (
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{event.location}</span>
          </div>
        )}
        <div className="flex items-center text-gray-500 dark:text-gray-400">
          <UserGroupIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>
            {joinedCount} joined
            {event.maxAttendees ? ` / ${event.maxAttendees} max` : ""}
          </span>
        </div>
        {event.registrationDeadline && (
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <ClockIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Deadline: {formatDate(event.registrationDeadline)}</span>
          </div>
        )}
      </div>

      {/* Join button */}
      <div className="flex justify-end mt-3">
        {isAuthenticated && !hasJoined && (
          <button
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            onClick={handleJoin}
          >
            Join Event
          </button>
        )}
        {isAuthenticated && hasJoined && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Joined
          </span>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {event.organizer && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Organizer
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {event.organizer.name}
              </p>
              {event.organizer.contact && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {event.organizer.contact}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
