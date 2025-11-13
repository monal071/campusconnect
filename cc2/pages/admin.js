import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import AddEventModal from "../components/AddEventModal";
import AddJobModal from "../components/AddJobModal";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EventIcon from "@mui/icons-material/Event";
import WorkIcon from "@mui/icons-material/Work";
import PeopleIcon from "@mui/icons-material/People";
import GroupsIcon from "@mui/icons-material/Groups";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AddIcon from "@mui/icons-material/Add";
import FolderIcon from "@mui/icons-material/Folder";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession({
    required: true,
    onUnauthenticated() {
      // Redirect to login if not authenticated
      router.push("/login");
    },
  });

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [resources, setResources] = useState([]);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);

  // Modal states for each management section
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [showJobsModal, setShowJobsModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showCommunitiesModal, setShowCommunitiesModal] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState({
    jobs: [],
    events: [],
    total: 0,
  });

  // Search states
  const [eventSearch, setEventSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [communitySearch, setCommunitySearch] = useState("");
  const [resourceSearch, setResourceSearch] = useState("");

  // Dummy handlers for add event/job (replace with real logic as needed)
  const handleAddEvent = async (eventData) => {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        setMessage("Event added successfully!");
        fetchEvents();
      } else {
        setMessage("Failed to add event.");
      }
    } catch (error) {
      console.error("Error adding event:", error);
      setMessage("Error adding event. Please try again.");
    }
    setShowAddEvent(false);
  };

  const handleAddJob = async (jobData) => {
    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jobData),
      });

      if (response.ok) {
        setMessage("Job added successfully!");
        fetchJobs();
      } else {
        setMessage("Failed to add job.");
      }
    } catch (error) {
      console.error("Error adding job:", error);
      setMessage("Error adding job. Please try again.");
    }
    setShowAddJob(false);
  };

  useEffect(() => {
    // Check if the user is an admin
    const checkAdmin = async () => {
      try {
        // Wait for session status to be determined
        if (sessionStatus === "loading") {
          console.log("Session loading, waiting...");
          return;
        }

        // Redirect if not authenticated
        if (sessionStatus !== "authenticated" || !session) {
          console.log("Not authenticated, redirecting to login");
          router.push("/login");
          return;
        }

        // Debug: Call the session debug endpoint to check the session data
        try {
          const debugRes = await fetch("/api/debug/session");
          const debugData = await debugRes.json();
          console.log("Session debug data:", debugData);
        } catch (e) {
          console.error("Failed to fetch debug data:", e);
        }

        const userRole = session?.user?.role;
        console.log("User role from session:", userRole);

        // Allow any authenticated user to access the admin page
        // but set isAdmin flag to handle UI differently
        setIsAdmin(userRole === "admin");
        setLoading(false);

        // Fetch data for the admin panel
        fetchUsers();
        fetchEvents();
        fetchJobs();
      } catch (error) {
        console.error("Failed to verify admin status:", error);
        router.push("/dashboard");
      }
    };

    checkAdmin();
    // Disable the exhaustive-deps rule because we handle these dependencies manually
  }, [session, sessionStatus, router]);

  // Define data fetching functions outside of useEffect to avoid dependency issues
  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      console.log("Events API response:", data);
      setEvents(data || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      console.log("Jobs API response:", data);
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/connections/users?q=");
    const data = await res.json();
    setUsers(data.users || []);
  };

  const fetchCommunities = async () => {
    try {
      const res = await fetch("/api/communities");
      const data = await res.json();
      console.log("Communities API response:", data);
      setCommunities(data.communities || []);
    } catch (error) {
      console.error("Failed to fetch communities:", error);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/resources");
      const data = await res.json();
      setResources(data.data || []);
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch("/api/admin/pending-approvals");
      const data = await response.json();
      if (data.success) {
        setPendingApprovals(data.data);
      }
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
    }
  };

  const handleDeleteUser = async (id) => {
    setMessage("");
    const res = await fetch(`/api/connections/users`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMessage("User deleted.");
      fetchUsers();
    } else {
      setMessage("Failed to delete user.");
    }
  };

  const handleDeleteCommunity = async (communityId) => {
    if (
      !confirm(
        "Are you sure you want to delete this community? This will delete all posts and cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/communities/${communityId}/delete`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete community");
      }

      setMessage("Community deleted successfully");
      fetchCommunities();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.message || "Error deleting community");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm("Are you sure you want to delete this resource?")) {
      return;
    }

    try {
      const response = await fetch(`/api/resources`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete resource");
      }

      // Immediately update the UI by removing the deleted resource
      setResources(resources.filter((r) => r._id !== resourceId));
      setMessage("Resource deleted successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage(error.message || "Error deleting resource");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Fetch data when component loads
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchEvents();
      fetchJobs();
      fetchUsers();
      fetchCommunities();
      fetchResources();
      fetchPendingApprovals();
    }
  }, [sessionStatus]);

  // If session is loading or not yet determined, show loading state
  if (loading || sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-300">
          Loading admin panel...
        </p>
      </div>
    );
  }

  // Filter functions
  const filteredEvents = events.filter(
    (event) =>
      event.title?.toLowerCase().includes(eventSearch.toLowerCase()) ||
      event.description?.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const filteredJobs = jobs.filter(
    (job) =>
      job.title?.toLowerCase().includes(jobSearch.toLowerCase()) ||
      job.company?.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredCommunities = communities.filter(
    (community) =>
      community.name?.toLowerCase().includes(communitySearch.toLowerCase()) ||
      community.description
        ?.toLowerCase()
        .includes(communitySearch.toLowerCase())
  );

  const filteredResources = resources.filter(
    (resource) =>
      resource.title?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      resource.description
        ?.toLowerCase()
        .includes(resourceSearch.toLowerCase()) ||
      resource.type?.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Click on any card to manage
          </p>
          {!isAdmin && (
            <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                ⚠️ Limited Access - You are viewing with non-admin privileges
              </p>
            </div>
          )}
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg"
          >
            {message}
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddEvent(true)}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all"
          >
            <AddIcon className="text-2xl" />
            <span>Add New Event</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddJob(true)}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-4 rounded-xl font-semibold shadow-lg transition-all"
          >
            <AddIcon className="text-2xl" />
            <span>Add New Job</span>
          </motion.button>
        </motion.div>

        {/* Management Cards - Clickable Solid Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Management Sections
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {/* Pending Approvals Card - Only for Admins */}
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPendingModal(true)}
                className="bg-gradient-to-br from-orange-500 to-red-600 p-8 rounded-2xl shadow-xl text-white text-left relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
                <PendingActionsIcon className="text-5xl mb-4 relative z-10" />
                <h3 className="text-2xl font-bold mb-2 relative z-10">
                  Pending
                </h3>
                <p className="text-orange-100 mb-4 relative z-10">
                  Awaiting approval
                </p>
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-3xl font-black">
                    {pendingApprovals.total || 0}
                  </span>
                  {pendingApprovals.total > 0 && (
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full animate-pulse">
                      Review
                    </span>
                  )}
                </div>
              </motion.button>
            )}

            {/* Events Card */}
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEventsModal(true)}
              className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-2xl shadow-xl text-white text-left relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <EventIcon className="text-5xl mb-4 relative z-10" />
              <h3 className="text-2xl font-bold mb-2 relative z-10">Events</h3>
              <p className="text-blue-100 mb-4 relative z-10">
                Manage campus events
              </p>
              <div className="flex items-center justify-between relative z-10">
                <span className="text-3xl font-black">{events.length}</span>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  View All
                </span>
              </div>
            </motion.button>

            {/* Jobs Card */}
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowJobsModal(true)}
              className="bg-gradient-to-br from-green-500 to-teal-600 p-8 rounded-2xl shadow-xl text-white text-left relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <WorkIcon className="text-5xl mb-4 relative z-10" />
              <h3 className="text-2xl font-bold mb-2 relative z-10">Jobs</h3>
              <p className="text-green-100 mb-4 relative z-10">
                Manage job postings
              </p>
              <div className="flex items-center justify-between relative z-10">
                <span className="text-3xl font-black">{jobs.length}</span>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  View All
                </span>
              </div>
            </motion.button>

            {/* Users Card */}
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUsersModal(true)}
              className="bg-gradient-to-br from-purple-500 to-pink-600 p-8 rounded-2xl shadow-xl text-white text-left relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <PeopleIcon className="text-5xl mb-4 relative z-10" />
              <h3 className="text-2xl font-bold mb-2 relative z-10">Users</h3>
              <p className="text-purple-100 mb-4 relative z-10">
                Manage user accounts
              </p>
              <div className="flex items-center justify-between relative z-10">
                <span className="text-3xl font-black">{users.length}</span>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  View All
                </span>
              </div>
            </motion.button>

            {/* Communities Card */}
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCommunitiesModal(true)}
              className="bg-gradient-to-br from-indigo-500 to-blue-600 p-8 rounded-2xl shadow-xl text-white text-left relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <GroupsIcon className="text-5xl mb-4 relative z-10" />
              <h3 className="text-2xl font-bold mb-2 relative z-10">
                Communities
              </h3>
              <p className="text-indigo-100 mb-4 relative z-10">
                Manage communities
              </p>
              <div className="flex items-center justify-between relative z-10">
                <span className="text-3xl font-black">
                  {communities.length}
                </span>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  View All
                </span>
              </div>
            </motion.button>

            {/* Resources Card */}
            <motion.button
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowResourcesModal(true)}
              className="bg-gradient-to-br from-yellow-500 to-orange-600 p-8 rounded-2xl shadow-xl text-white text-left relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-300"></div>
              <FolderIcon className="text-5xl mb-4 relative z-10" />
              <h3 className="text-2xl font-bold mb-2 relative z-10">
                Resources
              </h3>
              <p className="text-yellow-100 mb-4 relative z-10">
                Manage resources
              </p>
              <div className="flex items-center justify-between relative z-10">
                <span className="text-3xl font-black">{resources.length}</span>
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  View All
                </span>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Management Modals */}
      {/* Events Management Modal */}
      <AnimatePresence>
        {showEventsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEventsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <EventIcon className="text-white text-3xl" />
                  <h2 className="text-2xl font-bold text-white">
                    Manage Events
                  </h2>
                </div>
                <button
                  onClick={() => setShowEventsModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Events List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredEvents.map((event) => (
                    <motion.div
                      key={event._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          📅{" "}
                          {new Date(event.date).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm(`Delete "${event.title}"?`)) {
                            try {
                              const res = await fetch("/api/events", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: event._id }),
                              });
                              if (res.ok) {
                                setMessage("Event deleted successfully");
                                fetchEvents();
                                setTimeout(() => setMessage(""), 3000);
                              }
                            } catch (error) {
                              setMessage("Error deleting event");
                            }
                          }
                        }}
                        className="ml-4 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        title="Delete Event"
                      >
                        <DeleteOutlineIcon />
                      </button>
                    </motion.div>
                  ))}
                  {filteredEvents.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      {eventSearch
                        ? "🔍 No events found matching your search"
                        : "📭 No events yet"}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Jobs Management Modal */}
      <AnimatePresence>
        {showJobsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowJobsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-teal-500 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <WorkIcon className="text-white text-3xl" />
                  <h2 className="text-2xl font-bold text-white">Manage Jobs</h2>
                </div>
                <button
                  onClick={() => setShowJobsModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Jobs List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredJobs.map((job) => (
                    <motion.div
                      key={job._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          🏢 {job.company}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (
                            confirm(`Delete "${job.title}" at ${job.company}?`)
                          ) {
                            try {
                              const res = await fetch("/api/jobs", {
                                method: "DELETE",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: job._id }),
                              });
                              if (res.ok) {
                                setMessage("Job deleted successfully");
                                fetchJobs();
                                setTimeout(() => setMessage(""), 3000);
                              }
                            } catch (error) {
                              setMessage("Error deleting job");
                            }
                          }
                        }}
                        className="ml-4 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        title="Delete Job"
                      >
                        <DeleteOutlineIcon />
                      </button>
                    </motion.div>
                  ))}
                  {filteredJobs.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      {jobSearch
                        ? "🔍 No jobs found matching your search"
                        : "📭 No jobs yet"}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Users Management Modal */}
      <AnimatePresence>
        {showUsersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUsersModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PeopleIcon className="text-white text-3xl" />
                  <h2 className="text-2xl font-bold text-white">
                    Manage Users
                  </h2>
                </div>
                <button
                  onClick={() => setShowUsersModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Users List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="w-12 h-12 rounded-full ring-2 ring-purple-200 dark:ring-purple-600"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            📧 {user.email}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="ml-4 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        title="Delete User"
                      >
                        <DeleteOutlineIcon />
                      </button>
                    </motion.div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      {userSearch
                        ? "🔍 No users found matching your search"
                        : "📭 No users yet"}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Communities Management Modal */}
      <AnimatePresence>
        {showCommunitiesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCommunitiesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-blue-500 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GroupsIcon className="text-white text-3xl" />
                  <h2 className="text-2xl font-bold text-white">
                    Manage Communities
                  </h2>
                </div>
                <button
                  onClick={() => setShowCommunitiesModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search communities..."
                    value={communitySearch}
                    onChange={(e) => setCommunitySearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Communities List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredCommunities.map((community) => (
                    <motion.div
                      key={community._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {community.name}
                          </h3>
                          <span className="text-lg">
                            {community.isPrivate ? "🔒" : "🌐"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {community.description || "No description"}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>👥 {community.memberCount || 0} members</span>
                          <span>•</span>
                          <span>
                            {community.isPrivate ? "Private" : "Public"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCommunity(community._id)}
                        className="ml-4 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        title="Delete Community"
                      >
                        <DeleteOutlineIcon />
                      </button>
                    </motion.div>
                  ))}
                  {filteredCommunities.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      {communitySearch
                        ? "🔍 No communities found matching your search"
                        : "📭 No communities yet"}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resources Management Modal */}
      <AnimatePresence>
        {showResourcesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowResourcesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FolderIcon className="text-white text-3xl" />
                  <h2 className="text-2xl font-bold text-white">
                    Manage Resources
                  </h2>
                </div>
                <button
                  onClick={() => setShowResourcesModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Search Bar */}
                <div className="relative mb-4">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    value={resourceSearch}
                    onChange={(e) => setResourceSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                </div>

                {/* Resources List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredResources.map((resource) => (
                    <motion.div
                      key={resource._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          📁 {resource.type || "General"} • By{" "}
                          {resource.author || "Unknown"}
                        </p>
                        {resource.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteResource(resource._id)}
                        className="ml-4 p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                        title="Delete Resource"
                      >
                        <DeleteOutlineIcon />
                      </button>
                    </motion.div>
                  ))}
                  {filteredResources.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      {resourceSearch
                        ? "🔍 No resources found matching your search"
                        : "📭 No resources yet"}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Approvals Modal */}
      <AnimatePresence>
        {showPendingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPendingModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PendingActionsIcon className="text-white text-3xl" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Pending Approvals
                    </h2>
                    <p className="text-orange-100 text-sm">
                      {pendingApprovals.total || 0} items awaiting review
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPendingModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                {pendingApprovals.total === 0 ? (
                  <div className="text-center py-12">
                    <PendingActionsIcon className="text-gray-300 dark:text-gray-600 text-6xl mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      No Pending Approvals
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      All submissions have been reviewed
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Pending Events */}
                    {pendingApprovals.events?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <EventIcon className="text-blue-500" />
                          Pending Events ({pendingApprovals.events.length})
                        </h3>
                        <div className="space-y-3">
                          {pendingApprovals.events.map((event) => (
                            <motion.div
                              key={event._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                                    {event.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {event.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>
                                      📅{" "}
                                      {new Date(
                                        event.date
                                      ).toLocaleDateString()}
                                    </span>
                                    <span>📍 {event.location}</span>
                                    <span>
                                      👤 {event.submittedBy?.name || "Unknown"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(
                                          "/api/admin/pending-approvals",
                                          {
                                            method: "POST",
                                            headers: {
                                              "Content-Type":
                                                "application/json",
                                            },
                                            body: JSON.stringify({
                                              type: "event",
                                              itemId: event._id,
                                              action: "approve",
                                            }),
                                          }
                                        );
                                        if (res.ok) {
                                          setMessage(
                                            "Event approved successfully"
                                          );
                                          fetchPendingApprovals();
                                          fetchEvents();
                                          setTimeout(
                                            () => setMessage(""),
                                            3000
                                          );
                                        }
                                      } catch (error) {
                                        setMessage("Error approving event");
                                      }
                                    }}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-1"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm("Reject this event?")) {
                                        try {
                                          const res = await fetch(
                                            "/api/admin/pending-approvals",
                                            {
                                              method: "POST",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                type: "event",
                                                itemId: event._id,
                                                action: "reject",
                                              }),
                                            }
                                          );
                                          if (res.ok) {
                                            setMessage("Event rejected");
                                            fetchPendingApprovals();
                                            setTimeout(
                                              () => setMessage(""),
                                              3000
                                            );
                                          }
                                        } catch (error) {
                                          setMessage("Error rejecting event");
                                        }
                                      }
                                    }}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-1"
                                  >
                                    ✕ Reject
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Jobs */}
                    {pendingApprovals.jobs?.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <WorkIcon className="text-green-500" />
                          Pending Jobs ({pendingApprovals.jobs.length})
                        </h3>
                        <div className="space-y-3">
                          {pendingApprovals.jobs.map((job) => (
                            <motion.div
                              key={job._id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                                    {job.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {job.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span>🏢 {job.company}</span>
                                    <span>📍 {job.location}</span>
                                    <span>💰 {job.salary}</span>
                                    <span>
                                      👤 {job.submittedBy?.name || "Unknown"}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <button
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(
                                          "/api/admin/pending-approvals",
                                          {
                                            method: "POST",
                                            headers: {
                                              "Content-Type":
                                                "application/json",
                                            },
                                            body: JSON.stringify({
                                              type: "job",
                                              itemId: job._id,
                                              action: "approve",
                                            }),
                                          }
                                        );
                                        if (res.ok) {
                                          setMessage(
                                            "Job approved successfully"
                                          );
                                          fetchPendingApprovals();
                                          fetchJobs();
                                          setTimeout(
                                            () => setMessage(""),
                                            3000
                                          );
                                        }
                                      } catch (error) {
                                        setMessage("Error approving job");
                                      }
                                    }}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-1"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm("Reject this job?")) {
                                        try {
                                          const res = await fetch(
                                            "/api/admin/pending-approvals",
                                            {
                                              method: "POST",
                                              headers: {
                                                "Content-Type":
                                                  "application/json",
                                              },
                                              body: JSON.stringify({
                                                type: "job",
                                                itemId: job._id,
                                                action: "reject",
                                              }),
                                            }
                                          );
                                          if (res.ok) {
                                            setMessage("Job rejected");
                                            fetchPendingApprovals();
                                            setTimeout(
                                              () => setMessage(""),
                                              3000
                                            );
                                          }
                                        } catch (error) {
                                          setMessage("Error rejecting job");
                                        }
                                      }
                                    }}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-1"
                                  >
                                    ✕ Reject
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Event/Job Modals */}
      <AddEventModal
        open={showAddEvent}
        onClose={() => setShowAddEvent(false)}
        onSave={handleAddEvent}
      />
      <AddJobModal
        isOpen={showAddJob}
        onClose={() => setShowAddJob(false)}
        onAdd={handleAddJob}
      />
    </div>
  );
}
