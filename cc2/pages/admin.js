import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Head from "next/head";
import toast from "react-hot-toast";
import AddEventModal from "../components/AddEventModal";
import AddJobModal from "../components/AddJobModal";
import {
  CalendarIcon,
  BriefcaseIcon,
  UsersIcon,
  UserGroupIcon,
  FolderIcon,
  ClockIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

function ManagementModal({ isOpen, onClose, title, icon: Icon, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-3xl w-full max-h-[80vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative mb-4">
      <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [resources, setResources] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);

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

  const [eventSearch, setEventSearch] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [communitySearch, setCommunitySearch] = useState("");
  const [resourceSearch, setResourceSearch] = useState("");

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus !== "authenticated" || !session) {
      router.push("/login");
      return;
    }

    setIsAdmin(session?.user?.role === "admin");
    setLoading(false);
  }, [session, sessionStatus, router]);

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

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : data?.events || data?.data || []);
    } catch {
      setEvents([]);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/jobs");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : data?.items || []);
    } catch {
      setJobs([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/connections/users?q=");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setUsers([]);
    }
  };

  const fetchCommunities = async () => {
    try {
      const res = await fetch("/api/communities");
      const data = await res.json();
      setCommunities(data.communities || []);
    } catch {
      setCommunities([]);
    }
  };

  const fetchResources = async () => {
    try {
      const res = await fetch("/api/resources");
      const data = await res.json();
      setResources(data.data || []);
    } catch {
      setResources([]);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const res = await fetch("/api/admin/pending-approvals");
      const data = await res.json();
      if (data.success) setPendingApprovals(data.data);
    } catch {
      // ignore
    }
  };

  const handleAddEvent = async (eventData) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      if (res.ok) {
        toast.success("Event added");
        fetchEvents();
      } else {
        toast.error("Failed to add event");
      }
    } catch {
      toast.error("Error adding event");
    }
    setShowAddEvent(false);
  };

  const handleAddJob = async (jobData) => {
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData),
      });
      if (res.ok) {
        toast.success("Job added");
        fetchJobs();
      } else {
        toast.error("Failed to add job");
      }
    } catch {
      toast.error("Error adding job");
    }
    setShowAddJob(false);
  };

  const handleDeleteEvent = async (event) => {
    if (!confirm(`Delete "${event.title}"?`)) return;
    try {
      const res = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event._id }),
      });
      if (res.ok) {
        toast.success("Event deleted");
        fetchEvents();
      } else {
        toast.error("Failed to delete event");
      }
    } catch {
      toast.error("Error deleting event");
    }
  };

  const handleDeleteJob = async (job) => {
    if (!confirm(`Delete "${job.title}" at ${job.company}?`)) return;
    try {
      const res = await fetch("/api/jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: job._id }),
      });
      if (res.ok) {
        toast.success("Job deleted");
        fetchJobs();
      } else {
        toast.error("Failed to delete job");
      }
    } catch {
      toast.error("Error deleting job");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      const res = await fetch("/api/connections/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("User deleted");
        fetchUsers();
      } else {
        toast.error("Failed to delete user");
      }
    } catch {
      toast.error("Error deleting user");
    }
  };

  const handleDeleteCommunity = async (communityId) => {
    if (
      !confirm(
        "Delete this community? This will delete all posts and cannot be undone.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/communities/${communityId}/delete`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Community deleted");
        fetchCommunities();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to delete community");
      }
    } catch {
      toast.error("Error deleting community");
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm("Delete this resource?")) return;
    try {
      const res = await fetch("/api/resources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      });
      if (res.ok) {
        setResources((prev) => prev.filter((r) => r._id !== resourceId));
        toast.success("Resource deleted");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete resource");
      }
    } catch {
      toast.error("Error deleting resource");
    }
  };

  const handleApproval = async (type, itemId, action) => {
    if (action === "reject" && !confirm(`Reject this ${type}?`)) return;
    try {
      const res = await fetch("/api/admin/pending-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, itemId, action }),
      });
      if (res.ok) {
        toast.success(
          `${type.charAt(0).toUpperCase() + type.slice(1)} ${action}d`,
        );
        fetchPendingApprovals();
        if (type === "event") fetchEvents();
        if (type === "job") fetchJobs();
      } else {
        toast.error(`Failed to ${action} ${type}`);
      }
    } catch {
      toast.error(`Error processing ${type}`);
    }
  };

  // Filter functions
  const filteredEvents = (Array.isArray(events) ? events : []).filter(
    (e) =>
      e.title?.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.description?.toLowerCase().includes(eventSearch.toLowerCase()),
  );

  const filteredJobs = (Array.isArray(jobs) ? jobs : []).filter(
    (j) =>
      j.title?.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.company?.toLowerCase().includes(jobSearch.toLowerCase()),
  );

  const filteredUsers = (Array.isArray(users) ? users : []).filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()),
  );

  const filteredCommunities = (
    Array.isArray(communities) ? communities : []
  ).filter(
    (c) =>
      c.name?.toLowerCase().includes(communitySearch.toLowerCase()) ||
      c.description?.toLowerCase().includes(communitySearch.toLowerCase()),
  );

  const filteredResources = (Array.isArray(resources) ? resources : []).filter(
    (r) =>
      r.title?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.description?.toLowerCase().includes(resourceSearch.toLowerCase()) ||
      r.type?.toLowerCase().includes(resourceSearch.toLowerCase()),
  );

  if (loading || sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;

  const cards = [
    ...(isAdmin
      ? [
          {
            label: "Pending",
            count: pendingApprovals.total || 0,
            icon: ClockIcon,
            onClick: () => setShowPendingModal(true),
            highlight: pendingApprovals.total > 0,
          },
        ]
      : []),
    {
      label: "Events",
      count: events.length,
      icon: CalendarIcon,
      onClick: () => setShowEventsModal(true),
    },
    {
      label: "Jobs",
      count: jobs.length,
      icon: BriefcaseIcon,
      onClick: () => setShowJobsModal(true),
    },
    {
      label: "Users",
      count: users.length,
      icon: UsersIcon,
      onClick: () => setShowUsersModal(true),
    },
    {
      label: "Communities",
      count: communities.length,
      icon: UserGroupIcon,
      onClick: () => setShowCommunitiesModal(true),
    },
    {
      label: "Resources",
      count: resources.length,
      icon: FolderIcon,
      onClick: () => setShowResourcesModal(true),
    },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <Head>
        <title>Admin - CampusConnect</title>
      </Head>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your platform
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddEvent(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Event
          </button>
          <button
            onClick={() => setShowAddJob(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-lg transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Job
          </button>
        </div>
      </div>

      {/* Non-admin warning */}
      {!isAdmin && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Limited access - You are viewing with non-admin privileges
          </p>
        </div>
      )}

      {/* Management Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            className={`bg-white dark:bg-gray-800 rounded-lg border p-4 text-left hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors ${
              card.highlight
                ? "border-orange-300 dark:border-orange-700"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <card.icon
              className={`h-5 w-5 mb-2 ${
                card.highlight ? "text-orange-500" : "text-indigo-500"
              }`}
            />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {card.count}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
          </button>
        ))}
      </div>

      {/* Events Modal */}
      <ManagementModal
        isOpen={showEventsModal}
        onClose={() => setShowEventsModal(false)}
        title="Manage Events"
        icon={CalendarIcon}
      >
        <SearchBar
          value={eventSearch}
          onChange={setEventSearch}
          placeholder="Search events..."
        />
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredEvents.map((event) => (
            <div
              key={event._id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {event.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {event.date
                    ? new Date(event.date).toLocaleDateString()
                    : "No date"}
                </p>
              </div>
              <button
                onClick={() => handleDeleteEvent(event)}
                className="ml-3 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              {eventSearch ? "No events match your search" : "No events yet"}
            </p>
          )}
        </div>
      </ManagementModal>

      {/* Jobs Modal */}
      <ManagementModal
        isOpen={showJobsModal}
        onClose={() => setShowJobsModal(false)}
        title="Manage Jobs"
        icon={BriefcaseIcon}
      >
        <SearchBar
          value={jobSearch}
          onChange={setJobSearch}
          placeholder="Search jobs..."
        />
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredJobs.map((job) => (
            <div
              key={job._id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {job.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {job.company}
                </p>
              </div>
              <button
                onClick={() => handleDeleteJob(job)}
                className="ml-3 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {filteredJobs.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              {jobSearch ? "No jobs match your search" : "No jobs yet"}
            </p>
          )}
        </div>
      </ManagementModal>

      {/* Users Modal */}
      <ManagementModal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        title="Manage Users"
        icon={UsersIcon}
      >
        <SearchBar
          value={userSearch}
          onChange={setUserSearch}
          placeholder="Search users..."
        />
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-medium shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeleteUser(user._id)}
                className="ml-3 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              {userSearch ? "No users match your search" : "No users yet"}
            </p>
          )}
        </div>
      </ManagementModal>

      {/* Communities Modal */}
      <ManagementModal
        isOpen={showCommunitiesModal}
        onClose={() => setShowCommunitiesModal(false)}
        title="Manage Communities"
        icon={UserGroupIcon}
      >
        <SearchBar
          value={communitySearch}
          onChange={setCommunitySearch}
          placeholder="Search communities..."
        />
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredCommunities.map((community) => (
            <div
              key={community._id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {community.name}
                  </p>
                  {community.isPrivate ? (
                    <LockClosedIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  ) : (
                    <GlobeAltIcon className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {community.memberCount || 0} members
                  {community.isPrivate ? " - Private" : " - Public"}
                </p>
              </div>
              <button
                onClick={() => handleDeleteCommunity(community._id)}
                className="ml-3 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {filteredCommunities.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              {communitySearch
                ? "No communities match your search"
                : "No communities yet"}
            </p>
          )}
        </div>
      </ManagementModal>

      {/* Resources Modal */}
      <ManagementModal
        isOpen={showResourcesModal}
        onClose={() => setShowResourcesModal(false)}
        title="Manage Resources"
        icon={FolderIcon}
      >
        <SearchBar
          value={resourceSearch}
          onChange={setResourceSearch}
          placeholder="Search resources..."
        />
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredResources.map((resource) => (
            <div
              key={resource._id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {resource.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {resource.type || "General"} - By{" "}
                  {resource.author || "Unknown"}
                </p>
              </div>
              <button
                onClick={() => handleDeleteResource(resource._id)}
                className="ml-3 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          {filteredResources.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
              {resourceSearch
                ? "No resources match your search"
                : "No resources yet"}
            </p>
          )}
        </div>
      </ManagementModal>

      {/* Pending Approvals Modal */}
      <ManagementModal
        isOpen={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        title={`Pending Approvals (${pendingApprovals.total || 0})`}
        icon={ClockIcon}
      >
        {pendingApprovals.total === 0 ? (
          <p className="text-center py-8 text-sm text-gray-400 dark:text-gray-500">
            All submissions have been reviewed
          </p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Pending Events */}
            {pendingApprovals.events?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4 text-indigo-500" />
                  Events ({pendingApprovals.events.length})
                </h3>
                <div className="space-y-2">
                  {pendingApprovals.events.map((event) => (
                    <div
                      key={event._id}
                      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {event.date && (
                              <span>
                                {new Date(event.date).toLocaleDateString()}
                              </span>
                            )}
                            {event.location && <span>{event.location}</span>}
                            <span>
                              By {event.submittedBy?.name || "Unknown"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() =>
                              handleApproval("event", event._id, "approve")
                            }
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleApproval("event", event._id, "reject")
                            }
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Jobs */}
            {pendingApprovals.jobs?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <BriefcaseIcon className="h-4 w-4 text-indigo-500" />
                  Jobs ({pendingApprovals.jobs.length})
                </h3>
                <div className="space-y-2">
                  {pendingApprovals.jobs.map((job) => (
                    <div
                      key={job._id}
                      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {job.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {job.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                            {job.company && <span>{job.company}</span>}
                            {job.location && <span>{job.location}</span>}
                            {job.salary && <span>{job.salary}</span>}
                            <span>By {job.submittedBy?.name || "Unknown"}</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() =>
                              handleApproval("job", job._id, "approve")
                            }
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                          >
                            <CheckIcon className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleApproval("job", job._id, "reject")
                            }
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                          >
                            <XMarkIcon className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ManagementModal>

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
