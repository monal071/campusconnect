import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import toast from "react-hot-toast";
import { PlusIcon } from "@heroicons/react/24/outline";
import EventCard from "../../components/EventCard";
import AddEventModal from "../../components/AddEventModal";

export default function Events() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/events");
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        setEvents(
          Array.isArray(data)
            ? data
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
    if (status === "authenticated") fetchEvents();
  }, [status]);

  const handleAddEvent = async (eventData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit event");
      }

      const data = await response.json();

      if (data.isPending) {
        toast.success("Event submitted for approval");
      } else {
        setEvents((prev) => [data, ...prev]);
        toast.success("Event created successfully");
      }

      setShowAddModal(false);
    } catch (error) {
      toast.error(error.message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Head>
        <title>Events - CampusConnect</title>
      </Head>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Events
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Discover and join campus events
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Event
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Events Grid */}
      {events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              isAuthenticated={!!session}
              userId={session?.user?.id}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-400 dark:text-gray-500 mb-4">No events yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            Create the first event
          </button>
        </div>
      )}

      <AddEventModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddEvent}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
