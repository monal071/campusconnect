import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Head from "next/head";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import EventFormModal from "../../components/EventFormModal";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { PlusIcon } from "@heroicons/react/24/outline";
import EventCard from "../../components/EventCard";
import AddEventModal from "../../components/AddEventModal";

export default function Events() {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [myEventsError, setMyEventsError] = useState(null);
  const [myEventsLoading, setMyEventsLoading] = useState(false);
  const [myEventsRefresh, setMyEventsRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    type: "in-person",
    isPublic: true,
    tags: "",
    maxAttendees: "",
    registrationDeadline: "",
    organizer: {
      name: "",
      contact: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [retry, setRetry] = useState(0);
  const canCreateEvents = Boolean(session?.user);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/events?page=${page}&limit=20`);
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await response.json();
        setPagination(data.pagination || { totalPages: 1, total: data.events?.length || 0 });
        // API returns { events: [...] }
        setEvents(
          Array.isArray(data)
            ? data
            : Array.isArray(data.events)
              ? data.events
              : Array.isArray(data.data)
                ? data.data
                : [],
        );
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [page, retry]);

  useEffect(() => {
    if (activeTab !== "my" || !session?.user?.id) return;
    let cancelled = false;

    const fetchMyEvents = async () => {
      setMyEventsLoading(true);
      setMyEventsError(null);
      try {
        const response = await fetch("/api/events/mine");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load your events");
        }
        if (!cancelled) setMyEvents(Array.isArray(data.events) ? data.events : []);
      } catch (fetchError) {
        if (!cancelled) setMyEventsError(fetchError.message);
      } finally {
        if (!cancelled) setMyEventsLoading(false);
      }
    };

    fetchMyEvents();
    return () => {
      cancelled = true;
    };
  }, [activeTab, myEventsRefresh, session?.user?.id]);

  const handleCreateEvent = async (eventData) => {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create event");
      }

      const data = await response.json();
      if (data.event) setEvents((prev) => [data.event, ...prev]);
      toast.success(data.message);
      setShowEventModal(false);
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  };

  const handleEditEvent = async (eventData) => {
    try {
      const response = await fetch(`/api/events/${selectedEvent._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      const data = await response.json();
      setEvents((prev) =>
        prev.map((event) => (event._id === data._id ? data : event)),
      );
      setShowEventModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch("/api/events", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      setEvents(events.filter((event) => event._id !== eventId));
      toast.success("Event deleted successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create event");
      }

      const newEvent = await response.json();
      if (newEvent.event) setEvents(prev => [...prev, newEvent.event]);
      setShowAddForm(false);
      setFormData({
        title: "",
        description: "",
        location: "",
        date: "",
        type: "in-person",
        isPublic: true,
        tags: "",
        maxAttendees: "",
        registrationDeadline: "",
        organizer: {
          name: "",
          contact: "",
        },
      });
      toast.success(newEvent.message || "Event submitted");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleEventExpansion = (eventId) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const handleAddEvent = async (eventData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || errorData.error || "Failed to submit event",
        );
      }

      const data = await response.json();

      if (data.event) setEvents((prev) => [data.event, ...prev]);
      toast.success(data.message || "Event submitted");
      if (data.warning) toast(data.warning, { icon: "⚠️" });
      if (data.isPending) {
        setActiveTab("my");
        setMyEventsRefresh((value) => value + 1);
      }

      setShowAddModal(false);
    } catch (error) {
      console.error("Error submitting event:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [...new Set(events
    .map((event) => event.category || event.type)
    .filter(Boolean)
    .map(String))]
    .sort((a, b) => a.localeCompare(b));
  const now = Date.now();
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const myEventsById = new Map(myEvents.map((event) => [String(event._id), event]));
  const eventsToFilter = activeTab === "my"
    ? [
        ...myEventsById.values(),
        ...events.filter((event) => !myEventsById.has(String(event._id))),
      ]
    : events;
  const visibleEvents = eventsToFilter
    .filter((event) => {
      if (!event.date) return false;
      const eventTime = new Date(event.date).getTime();
      if (!Number.isFinite(eventTime)) return false;
      const isUpcoming = eventTime >= now;
      const hasJoined = Boolean(
        session?.user?.id &&
        Array.isArray(event.joined) &&
        event.joined.some((id) => String(id) === String(session.user.id)),
      );
      const isCreatedByUser = Boolean(
        session?.user?.id &&
        String(event.createdBy) === String(session.user.id),
      );

      if (activeTab === "past" && isUpcoming) return false;
      if (activeTab === "upcoming" && !isUpcoming) return false;
      if (activeTab === "my" && !hasJoined && !isCreatedByUser) return false;

      const category = String(event.category || event.type || "");
      if (
        selectedCategory &&
        category.toLowerCase() !== selectedCategory.toLowerCase()
      ) {
        return false;
      }

      if (dateFrom && eventTime < new Date(`${dateFrom}T00:00:00`).getTime()) {
        return false;
      }
      if (
        dateTo &&
        eventTime >=
          new Date(`${dateTo}T00:00:00`).getTime() + 24 * 60 * 60 * 1000
      ) {
        return false;
      }

      if (normalizedSearch) {
        const searchableText = [
          event.title,
          event.description,
          event.location,
          category,
          ...(Array.isArray(event.tags) ? event.tags : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!searchableText.includes(normalizedSearch)) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const dateDifference = new Date(a.date).getTime() - new Date(b.date).getTime();
      return activeTab === "past" ? -dateDifference : dateDifference;
    });
  const activeTabLabel = {
    upcoming: "upcoming",
    my: "your",
    past: "past",
  }[activeTab];
  const noEventsMessage = {
    upcoming: "No upcoming events match your search.",
    my: session
      ? "You have not created or joined any events matching these filters."
      : "Sign in to see events you have registered for.",
    past: "No past events match your search.",
  }[activeTab];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => setRetry(value => value + 1)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Events | CampusConnect</title>
      </Head>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Campus Events
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Find your next campus experience.
              </p>
            </div>
            {canCreateEvents && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Event
              </motion.button>
            )}
          </div>
        </div>

        <div className="mb-5 space-y-4">
          <label className="sr-only" htmlFor="event-search">Search events</label>
          <input
            id="event-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search events, workshops..."
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Event lists">
            {[
              { id: "upcoming", label: "Upcoming" },
              { id: "my", label: "My Events" },
              { id: "past", label: "Past Events" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="sr-only" htmlFor="event-category">Filter by category</label>
            <select
              id="event-category"
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              From
              <input
                aria-label="Start date"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-gray-800 dark:text-gray-200"
              />
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              To
              <input
                aria-label="End date"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-gray-800 dark:text-gray-200"
              />
            </label>
          </div>
        </div>

        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Explore events</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {visibleEvents.length} {activeTabLabel} event{visibleEvents.length === 1 ? "" : "s"} on this page
            </p>
          </div>
        </div>

        {activeTab === "my" && myEventsError && (
          <div role="alert" className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {myEventsError}
          </div>
        )}

        {activeTab === "my" && myEventsLoading ? (
          <LoadingSpinner />
        ) : visibleEvents.length > 0 ? (
          <div className="space-y-3">
            {visibleEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                isAuthenticated={!!session}
                userId={session?.user?.id}
                onJoined={() => {
                  const joinedUserId = session?.user?.id;
                  if (!joinedUserId) return;
                  setEvents((previousEvents) =>
                    previousEvents.map((item) => {
                      if (item._id !== event._id) return item;
                      const joined = item.joined || [];
                      return joined.some((id) => String(id) === String(joinedUserId))
                        ? item
                        : { ...item, joined: [...joined, joinedUserId] };
                    }),
                  );
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white py-14 text-center dark:border-gray-800 dark:bg-gray-800">
            <div className="mb-4">
              <CalendarTodayIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {noEventsMessage}
            </p>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <nav aria-label="Event pages" className="flex justify-center items-center gap-4 my-8">
            <button className="px-4 py-2 rounded border disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button>
            <span>Page {page} of {pagination.totalPages}</span>
            <button className="px-4 py-2 rounded border disabled:opacity-40" disabled={page >= pagination.totalPages} onClick={() => setPage(value => value + 1)}>Next</button>
          </nav>
        )}
      </main>
      <EventFormModal
        open={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        onSubmit={selectedEvent ? handleEditEvent : handleCreateEvent}
        event={selectedEvent}
      />
      <AddEventModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddEvent}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
