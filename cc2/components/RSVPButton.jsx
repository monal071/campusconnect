import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  UserGroupIcon,
  ClockIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const RSVP_STATUS = {
  GOING: "going",
  NOT_GOING: "not_going",
  MAYBE: "maybe",
  NONE: null,
};

export default function RSVPButton({ eventId, event, onUpdate }) {
  const { data: session } = useSession();
  const [rsvpStatus, setRsvpStatus] = useState(RSVP_STATUS.NONE);
  const [attendeeCounts, setAttendeeCounts] = useState({
    going: 0,
    not_going: 0,
    maybe: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [reminder, setReminder] = useState(false);

  // Fetch user's RSVP status and counts
  useEffect(() => {
    if (session?.user && eventId) {
      fetchRSVPStatus();
    }
  }, [session, eventId]);

  const fetchRSVPStatus = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`);
      if (res.ok) {
        const data = await res.json();
        setRsvpStatus(data.userStatus || RSVP_STATUS.NONE);
        setAttendeeCounts(data.counts);
        setReminder(data.reminder || false);
      }
    } catch (error) {
      console.error("Failed to fetch RSVP status:", error);
    }
  };

  const handleRSVP = async (status) => {
    if (!session?.user) {
      toast.error("Please login to RSVP");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const data = await res.json();
        setRsvpStatus(status);
        setAttendeeCounts(data.counts);
        onUpdate?.(data);

        toast.success(
          status === RSVP_STATUS.GOING
            ? "You're going!"
            : status === RSVP_STATUS.MAYBE
            ? "Marked as maybe"
            : "RSVP updated"
        );
      } else {
        throw new Error("Failed to update RSVP");
      }
    } catch (error) {
      toast.error("Failed to update RSVP");
      console.error(error);
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  const toggleReminder = async () => {
    if (!session?.user) {
      toast.error("Please login to set reminders");
      return;
    }

    try {
      const res = await fetch(`/api/events/${eventId}/reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !reminder }),
      });

      if (res.ok) {
        setReminder(!reminder);
        toast.success(!reminder ? "Reminder set!" : "Reminder removed");
      }
    } catch (error) {
      toast.error("Failed to toggle reminder");
      console.error(error);
    }
  };

  const getRSVPIcon = (status) => {
    switch (status) {
      case RSVP_STATUS.GOING:
        return <CheckCircleIcon className="w-5 h-5" />;
      case RSVP_STATUS.NOT_GOING:
        return <XCircleIcon className="w-5 h-5" />;
      case RSVP_STATUS.MAYBE:
        return <QuestionMarkCircleIcon className="w-5 h-5" />;
      default:
        return <UserGroupIcon className="w-5 h-5" />;
    }
  };

  const getRSVPText = (status) => {
    switch (status) {
      case RSVP_STATUS.GOING:
        return "Going";
      case RSVP_STATUS.NOT_GOING:
        return "Not Going";
      case RSVP_STATUS.MAYBE:
        return "Maybe";
      default:
        return "RSVP";
    }
  };

  const getRSVPColor = (status) => {
    switch (status) {
      case RSVP_STATUS.GOING:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case RSVP_STATUS.NOT_GOING:
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case RSVP_STATUS.MAYBE:
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
  };

  return (
    <div className="relative">
      {/* RSVP Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${getRSVPColor(
          rsvpStatus
        )} ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {getRSVPIcon(rsvpStatus)}
        <span>{getRSVPText(rsvpStatus)}</span>
        {attendeeCounts.going > 0 && (
          <span className="ml-1 text-sm opacity-75">
            ({attendeeCounts.going})
          </span>
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[250px]"
          >
            {/* RSVP Options */}
            <div className="p-2">
              <button
                onClick={() => handleRSVP(RSVP_STATUS.GOING)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  rsvpStatus === RSVP_STATUS.GOING
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <CheckCircleIcon className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Going</div>
                  <div className="text-xs opacity-75">
                    {attendeeCounts.going}{" "}
                    {attendeeCounts.going === 1 ? "person" : "people"}
                  </div>
                </div>
                {rsvpStatus === RSVP_STATUS.GOING && (
                  <CheckCircleSolidIcon className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => handleRSVP(RSVP_STATUS.MAYBE)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  rsvpStatus === RSVP_STATUS.MAYBE
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <QuestionMarkCircleIcon className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Maybe</div>
                  <div className="text-xs opacity-75">
                    {attendeeCounts.maybe}{" "}
                    {attendeeCounts.maybe === 1 ? "person" : "people"}
                  </div>
                </div>
                {rsvpStatus === RSVP_STATUS.MAYBE && (
                  <CheckCircleSolidIcon className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => handleRSVP(RSVP_STATUS.NOT_GOING)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  rsvpStatus === RSVP_STATUS.NOT_GOING
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <XCircleIcon className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Can&apos;t Go</div>
                  <div className="text-xs opacity-75">
                    {attendeeCounts.not_going}{" "}
                    {attendeeCounts.not_going === 1 ? "person" : "people"}
                  </div>
                </div>
                {rsvpStatus === RSVP_STATUS.NOT_GOING && (
                  <CheckCircleSolidIcon className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Reminder Toggle */}
            {rsvpStatus === RSVP_STATUS.GOING && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700" />
                <div className="p-2">
                  <button
                    onClick={toggleReminder}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <BellAlertIcon
                      className={`w-5 h-5 ${
                        reminder ? "text-blue-600 dark:text-blue-400" : ""
                      }`}
                    />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Event Reminder</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {reminder ? "Enabled" : "Set reminder"}
                      </div>
                    </div>
                    {reminder && (
                      <CheckCircleSolidIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

// Attendees List Component
export function RSVPAttendeesList({ eventId }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("going"); // going, maybe, not_going

  useEffect(() => {
    fetchAttendees();
  }, [eventId, filter]);

  const fetchAttendees = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/events/${eventId}/attendees?status=${filter}`
      );
      if (res.ok) {
        const data = await res.json();
        setAttendees(data.attendees);
      }
    } catch (error) {
      console.error("Failed to fetch attendees:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { value: "going", label: "Going", color: "green" },
          { value: "maybe", label: "Maybe", color: "yellow" },
          { value: "not_going", label: "Can't Go", color: "red" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === tab.value
                ? `border-b-2 border-${tab.color}-500 text-${tab.color}-600 dark:text-${tab.color}-400`
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Attendees List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : attendees.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No{" "}
          {filter === "going"
            ? "attendees"
            : filter === "maybe"
            ? "maybes"
            : "declines"}{" "}
          yet
        </div>
      ) : (
        <div className="space-y-2">
          {attendees.map((attendee) => (
            <div
              key={attendee._id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <img
                src={attendee.image || "/default-avatar.png"}
                alt={attendee.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  {attendee.name}
                </div>
                {attendee.respondedAt && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    Responded{" "}
                    {new Date(attendee.respondedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
