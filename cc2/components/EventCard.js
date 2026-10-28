import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { CalendarIcon, MapPinIcon, UserGroupIcon, ClockIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";

export default function EventCard({ event, isAuthenticated, userId, onJoined }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [joinedCount, setJoinedCount] = useState(
    Array.isArray(event?.joined) ? event.joined.length : 0,
  );
  const [hasJoined, setHasJoined] = useState(
    Boolean(userId && event?.joined?.some((id) => String(id) === String(userId))),
  );
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    setJoinedCount(Array.isArray(event?.joined) ? event.joined.length : 0);
    setHasJoined(
      Boolean(
        userId &&
        event?.joined?.some((id) => String(id) === String(userId)),
      ),
    );
  }, [event?.joined, userId]);

  if (!event || typeof event !== "object") return null;

  const parsedDate = event.date ? new Date(event.date) : null;
  const validDate = parsedDate && Number.isFinite(parsedDate.getTime());
  const isUpcoming = validDate && parsedDate.getTime() >= Date.now();
  const isPending = event.status === "pending";
  const isRejected = event.status === "rejected";
  const category = String(event.category || event.type || "Campus event");
  const registrationDeadline = event.registrationDeadline
    ? new Date(event.registrationDeadline)
    : null;
  const validDeadline =
    registrationDeadline && Number.isFinite(registrationDeadline.getTime());
  const dateLabel = validDate
    ? { month: format(parsedDate, "MMM"), day: format(parsedDate, "d") }
    : { month: "TBD", day: "--" };

  const handleJoin = async () => {
    if (!userId || !event._id || joining) return;
    setJoining(true);
    try {
      const response = await fetch("/api/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event._id, userId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not join this event");
      if (data.success) {
        setHasJoined(true);
        setJoinedCount(data.joinedCount ?? joinedCount + 1);
        onJoined?.();
        window.dispatchEvent(new Event("campus:data-changed"));
        toast.success("Event joined");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setJoining(false);
    }
  };

  return (
    <article
      tabIndex={0}
      aria-label={`Event: ${event.title || "Untitled event"}. Activate to expand details.`}
      onClick={(clickEvent) => {
        if (!clickEvent.target.closest("button")) {
          setIsExpanded((expanded) => !expanded);
        }
      }}
      onKeyDown={(keyEvent) => {
        if (
          keyEvent.target === keyEvent.currentTarget &&
          (keyEvent.key === "Enter" || keyEvent.key === " ")
        ) {
          keyEvent.preventDefault();
          setIsExpanded((expanded) => !expanded);
        }
      }}
      className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-800/80 dark:hover:border-indigo-700"
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="flex h-[72px] w-[64px] shrink-0 flex-col items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-200">
          <span className="text-xs font-bold uppercase tracking-wide">{dateLabel.month}</span>
          <span className="text-2xl font-bold leading-tight">{dateLabel.day}</span>
        </div>

        <div className="min-w-0 flex-1">
          <span className="inline-flex max-w-full truncate rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
            {category}
          </span>
          <h3 className="mt-2 text-lg font-bold leading-snug text-gray-900 dark:text-white">
            {event.title || "Untitled event"}
          </h3>
          {event.description && (
            <p className={`mt-1 text-sm text-gray-600 dark:text-gray-400 ${isExpanded ? "" : "line-clamp-2"}`}>
              {event.description}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
            {validDate && (
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="h-4 w-4" />
                {format(parsedDate, "h:mm a")}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPinIcon className="h-4 w-4" />
                {event.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <UserGroupIcon className="h-4 w-4" />
              {joinedCount} attending
            </span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-gray-200 pt-4 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 shrink-0" />
            <span>{validDate ? format(parsedDate, "EEEE, MMMM d, yyyy 'at' h:mm a") : "Date to be announced"}</span>
          </div>
          {event.maxAttendees && (
            <p className="mt-2">Capacity: {event.maxAttendees} attendees</p>
          )}
          {validDeadline && (
            <p className="mt-2">
              Registration closes {format(registrationDeadline, "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
          {event.organizer && (
            <div className="mt-3">
              <p className="font-semibold text-gray-800 dark:text-gray-200">
                {event.organizer.name || "Organizer"}
              </p>
              {event.organizer.contact && <p>{event.organizer.contact}</p>}
            </div>
          )}
          {Array.isArray(event.tags) && event.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {event.tags.map((tag, index) => (
                <span key={`${tag}-${index}`} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs dark:bg-gray-700">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {isPending
            ? "Awaiting admin approval"
            : isRejected
              ? "Submission rejected"
              : isUpcoming
                ? "Registration open"
                : "Event has ended"}
        </span>
        {isPending || isRejected ? (
          <span className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            isPending
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
              : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
          }`}>
            {isPending ? "Pending" : "Rejected"}
          </span>
        ) : hasJoined ? (
          <span className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            Joined
          </span>
        ) : isAuthenticated && isUpcoming && String(event.createdBy) !== String(userId) ? (
          <button
            type="button"
            onClick={handleJoin}
            disabled={joining}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {joining ? "Registering..." : "Register"}
          </button>
        ) : (
          <button
            type="button"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            {isExpanded ? "Hide details" : "View details"}
          </button>
        )}
      </div>
    </article>
  );
}
