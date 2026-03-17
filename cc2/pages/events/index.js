import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PublicIcon from "@mui/icons-material/Public";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Head from "next/head";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import EventFormModal from "../../components/EventFormModal";
import { formatDateLong } from "../../util/dateFormat";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { TrashIcon, PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import EventCard from "../../components/EventCard";
import AddEventModal from "../../components/AddEventModal";

export default function Events() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const data = await response.json();
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
  }, []);

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
      setEvents((prev) => [data, ...prev]);
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
      setEvents([...events, newEvent]);
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
      toast.success("Event created successfully!");
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
        throw new Error(errorData.error || "Failed to submit event");
      }

      const data = await response.json();

      // Check if event was submitted for approval or published directly
      if (data.message && data.message.includes("submitted for approval")) {
        // Show success message for pending approval
        console.log("Event submitted for approval");
      } else {
        // Admin user - event published directly
        setEvents((prev) => [data, ...prev]);
      }

      setShowAddModal(false);
    } catch (error) {
      console.error("Error submitting event:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => {}} />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>Events | CampusConnect</title>
      </Head>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Upcoming Events
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover and attend amazing events happening on campus
              </p>
            </div>
            {session && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Event
              </motion.button>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Events</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{events.length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CalendarTodayIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Upcoming</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {events.filter(e => new Date(e.date) > new Date()).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CalendarTodayIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Event Types</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {new Set(events.map(e => e.type || 'in-person')).size}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <PublicIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <EventCard
                event={event}
                isAuthenticated={!!session}
                userId={session?.user?.id}
              />
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-4">
              <CalendarTodayIcon className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No events available
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {session
                ? "Check back later or create the first event!"
                : "Sign in to create events or register for upcoming events"}
            </p>
            {session && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create First Event
              </motion.button>
            )}
          </div>
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
