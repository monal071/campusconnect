import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";
import AddEventModal from '../components/AddEventModal';
import AddJobModal from '../components/AddJobModal';
import PendingApprovals from '../components/PendingApprovals';

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession({
    required: true,
    onUnauthenticated() {
      // Redirect to login if not authenticated
      router.push('/login');
    },
  });
  
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);
  // Dummy handlers for add event/job (replace with real logic as needed)
  const handleAddEvent = async (eventData) => {
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        setMessage('Event added successfully!');
        fetchEvents();
      } else {
        setMessage('Failed to add event.');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      setMessage('Error adding event. Please try again.');
    }
    setShowAddEvent(false);
  };
  
  const handleAddJob = async (jobData) => {
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData),
      });

      if (response.ok) {
        setMessage('Job added successfully!');
        fetchJobs();
      } else {
        setMessage('Failed to add job.');
      }
    } catch (error) {
      console.error('Error adding job:', error);
      setMessage('Error adding job. Please try again.');
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
          router.push('/login');
          return;
        }
        
        // Debug: Call the session debug endpoint to check the session data
        try {
          const debugRes = await fetch('/api/debug/session');
          const debugData = await debugRes.json();
          console.log("Session debug data:", debugData);
        } catch (e) {
          console.error("Failed to fetch debug data:", e);
        }
        
        const userRole = session?.user?.role;
        console.log("User role from session:", userRole);
        
        // Allow any authenticated user to access the admin page
        // but set isAdmin flag to handle UI differently
        setIsAdmin(userRole === 'admin');
        setLoading(false);
        
        // Fetch data for the admin panel
        fetchPosts();
        fetchUsers();
        fetchEvents();
        fetchJobs();
      } catch (error) {
        console.error("Failed to verify admin status:", error);
        router.push('/home');
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

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(data.data || []);
  };
  const fetchUsers = async () => {
    const res = await fetch("/api/connections/users?q=");
    const data = await res.json();
    setUsers(data.users || []);
  };

  const handleDeletePost = async (id) => {
    setMessage("");
    const res = await fetch(`/api/posts`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMessage("Post deleted.");
      fetchPosts();
    } else {
      setMessage("Failed to delete post.");
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
  
  // If session is loading or not yet determined, show loading state
  if (loading || sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
        <div className="border border-gray-200 dark:border-gray-700 p-10 flex flex-col items-center w-full max-w-md">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {sessionStatus === 'loading' ? 'Loading session...' : 'Checking admin privileges...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-full max-w-4xl">
        {!isAdmin && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium">Warning: Limited Access</p>
                <p className="text-sm">You are viewing the admin panel with a non-admin account. Some actions may not work correctly.</p>
              </div>
            </div>
          </div>
        )}
        
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Admin Panel</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You are logged in as a <b>{isAdmin ? 'admin' : 'regular user'}</b>.
        </p>
        {message && <div className="mb-4 text-center text-red-600">{message}</div>}
        <div className="flex gap-4 mb-8">
          <button
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:scale-105 transition-transform"
            onClick={() => setShowAddEvent(true)}
          >
            Add Event
          </button>
          <button
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold shadow-lg hover:scale-105 transition-transform"
            onClick={() => setShowAddJob(true)}
          >
            Add Job
          </button>
        </div>

        {/* Pending Approvals Section - Only for Admins */}
        {isAdmin && (
          <div className="w-full mb-8">
            <PendingApprovals />
          </div>
        )}
        <div className="w-full mb-8">
          <h2 className="text-xl font-bold mb-2">Manage Posts</h2>
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post._id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-3">
                <span className="line-clamp-1 max-w-xs">{post.content}</span>
                <button onClick={() => handleDeletePost(post._id)} className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Remove Post</button>
              </li>
            ))}
            {posts.length === 0 && <li className="text-gray-400">No posts found.</li>}
          </ul>
        </div>
        <div className="w-full mb-8">
          <h2 className="text-xl font-bold mb-2">Manage Events</h2>
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event._id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-3">
                <div>
                  <span className="font-medium">{event.title}</span>
                  <span className="ml-2 text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <button 
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this event?')) {
                      try {
                        const res = await fetch('/api/events', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: event._id }),
                        });
                        if (res.ok) {
                          setMessage('Event deleted successfully');
                          fetchEvents();
                        } else {
                          setMessage('Failed to delete event');
                        }
                      } catch (error) {
                        console.error('Error deleting event:', error);
                        setMessage('Error deleting event');
                      }
                    }
                  }}
                  className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove Event
                </button>
              </li>
            ))}
            {events.length === 0 && <li className="text-gray-400">No events found.</li>}
          </ul>
        </div>
        
        <div className="w-full mb-8">
          <h2 className="text-xl font-bold mb-2">Manage Jobs</h2>
          <ul className="space-y-2">
            {jobs.map((job) => (
              <li key={job._id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-3">
                <div>
                  <span className="font-medium">{job.title}</span>
                  <span className="ml-2 text-sm text-gray-500">at {job.company}</span>
                </div>
                <button 
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this job?')) {
                      try {
                        const res = await fetch('/api/jobs', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: job._id }),
                        });
                        if (res.ok) {
                          setMessage('Job deleted successfully');
                          fetchJobs();
                        } else {
                          setMessage('Failed to delete job');
                        }
                      } catch (error) {
                        console.error('Error deleting job:', error);
                        setMessage('Error deleting job');
                      }
                    }
                  }}
                  className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove Job
                </button>
              </li>
            ))}
            {jobs.length === 0 && <li className="text-gray-400">No jobs found.</li>}
          </ul>
        </div>
        
        <div className="w-full">
          <h2 className="text-xl font-bold mb-2">Manage Users</h2>
          <ul className="space-y-2">
            {users.map((user) => (
              <li key={user._id} className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-3">
                <span>{user.name} ({user.email})</span>
                <button onClick={() => handleDeleteUser(user._id)} className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Remove User</button>
              </li>
            ))}
            {users.length === 0 && <li className="text-gray-400">No users found.</li>}
          </ul>
        </div>
        
        <AddEventModal open={showAddEvent} onClose={() => setShowAddEvent(false)} onSave={handleAddEvent} />
        <AddJobModal isOpen={showAddJob} onClose={() => setShowAddJob(false)} onAdd={handleAddJob} />
      </div>
    </div>
  );
}
