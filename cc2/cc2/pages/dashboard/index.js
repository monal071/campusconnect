import { useState, useEffect } from 'react';
import { useSession, signOut, update } from 'next-auth/react';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MessageIcon from '@mui/icons-material/Message';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Avatar } from '@mui/material';
import AddEventModal from '../../components/AddEventModal';
import ConnectionRequests from '../../components/ConnectionRequests';
import HomeButton from '../../components/HomeButton';
import Link from 'next/link';
import { formatDateLong } from '../../util/dateFormat';
import Head from 'next/head';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import Feed from '../../components/Feed';
import { motion } from 'framer-motion';
import Toast from '../../components/Toast';
import Modal from '../../components/Modal';
import PostEditor from '../../components/PostEditor';

export default function Dashboard() {
  const { data: session, update: updateSession } = useSession();
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [toast, setToast] = useState(null);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchDashboardData();
      loadDashboardContent();
    }
  }, [session]);

  const handleUpdateProfile = async (updatedProfile) => {
    try {
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfile),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      // Update the session
      await updateSession({
        ...session,
        user: {
          ...session.user,
          name: data.data.name,
          image: data.data.image,
          // Add any other session data you want to update
        }
      });

      // Update the dashboard data with the new profile information
      setDashboardData(prev => ({
        ...prev,
        user: data.data
      }));

      // Force a refresh of the dashboard data
      const dashboardResponse = await fetch('/api/dashboard');
      const dashboardData = await dashboardResponse.json();
      setDashboardData(dashboardData);
    } catch (error) {
      console.error('Error updating profile:', error);
      // You might want to show an error message to the user here
    }
  };

  const handleAddEvent = async (eventData) => {
    try {
      setError(null);
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add event');
      }

      const newEvent = await response.json();
      setEvents(prev => [newEvent, ...prev]);
      setShowAddEventModal(false);
    } catch (error) {
      console.error('Error adding event:', error);
      setError(error.message);
    }
  };

  const handleEventAction = async (eventId, action) => {
    try {
      const response = await fetch('/api/events/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId, action }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event status');
      }

      // Refresh events after action
      const eventsResponse = await fetch('/api/events');
      if (eventsResponse.ok) {
        const data = await eventsResponse.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error handling event action:', error);
      setError(error.message);
    }
  };

  const isThisMonth = (date) => {
    const eventDate = new Date(date);
    const now = new Date();
    return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
  };

  const isUpcoming = (date) => {
    const eventDate = new Date(date);
    const now = new Date();
    return eventDate > now;
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'connections', name: 'Connections' },
    { id: 'messages', name: 'Messages' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tasks and Notes Section */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Notes */}
              <div className="bg-[#1D1D1D] rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Notes</h2>
                <textarea
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="Write your notes here..."
                  className="w-full h-32 p-2 border rounded bg-[#252525] border-gray-700 text-white"
                />
              </div>

              {/* Tasks */}
              <div className="bg-[#1D1D1D] rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Tasks</h2>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    placeholder="Add a new task..."
                    className="flex-1 p-2 border rounded bg-[#252525] border-gray-700 text-white"
                  />
                  <button
                    onClick={addTask}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                </div>
                <ul className="space-y-2">
                  {tasks.map((task) => (
                    <li
                      key={task.id}
                      className="flex items-center justify-between p-2 border rounded border-gray-700 bg-[#252525]"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="h-4 w-4"
                        />
                        <span className={task.completed ? 'line-through text-gray-500' : 'text-white'}>
                          {task.text}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recent Notifications Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Notifications */}
              <div className="bg-[#1D1D1D] rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Notifications</h2>
                <p className="text-gray-400 text-sm mb-6">Stay updated with the latest activities</p>
                
                <div className="space-y-4">
                  {dashboardData?.recentActivity.map((activity, index) => (
                    <NotificationItem
                      key={index}
                      icon={getActivityIcon(activity.type)}
                      title={activity.title}
                      time={formatTimeAgo(activity.timestamp)}
                    />
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-[#1D1D1D] rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    href="/events"
                    className="flex items-center gap-3 bg-[#252525] hover:bg-[#2a2a2a] p-4 rounded-lg transition-colors"
                  >
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <EventIcon className="text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-medium">Events</h3>
                      <p className="text-sm text-gray-400">View upcoming events</p>
                    </div>
                  </Link>
                  {/* Add other quick links here */}
                </div>
              </div>
            </div>
          </div>
        );
      case 'connections':
        return <ConnectionRequests />;
      case 'messages':
        return null; // Add your messages content here
      default:
        return null;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'connection':
        return <PersonIcon className="text-blue-500" />;
      case 'event':
        return <CalendarTodayIcon className="text-green-500" />;
      case 'message':
        return <MessageIcon className="text-purple-500" />;
      default:
        return null;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    return 'Just now';
  };

  const formatDate = (dateString) => {
    return formatDateLong(dateString);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const loadDashboardContent = async () => {
    try {
      const [notesResponse, tasksResponse] = await Promise.all([
        fetch('/api/dashboard/content?type=notes'),
        fetch('/api/dashboard/content?type=tasks')
      ]);

      if (notesResponse.ok && tasksResponse.ok) {
        const notesData = await notesResponse.json();
        const tasksData = await tasksResponse.json();

        setNotes(notesData.content || '');
        setTasks(tasksData.content || []);
      }
    } catch (error) {
      showToast('Failed to load dashboard content', 'error');
    }
  };

  const saveContent = async (content, type) => {
    try {
      const response = await fetch('/api/dashboard/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save content');
      }

      showToast('Changes saved successfully', 'success');
    } catch (error) {
      console.error('Error saving content:', error);
      showToast(`Failed to save changes: ${error.message}`, 'error');
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    // Debounce save to avoid too many requests
    const timeoutId = setTimeout(() => {
      saveContent(e.target.value, 'notes');
    }, 1000);
    return () => clearTimeout(timeoutId);
  };

  const addTask = async () => {
    if (!newTask.trim()) return;

    const updatedTasks = [...tasks, { id: Date.now(), text: newTask, completed: false }];
    setTasks(updatedTasks);
    setNewTask('');
    await saveContent(updatedTasks, 'tasks');
  };

  const toggleTask = async (taskId) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    await saveContent(updatedTasks, 'tasks');
  };

  const deleteTask = async (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    await saveContent(updatedTasks, 'tasks');
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Add this handler for post submission
  const handlePostSubmit = async (formData) => {
    setIsPosting(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to post');
      setShowPostModal(false);
      showToast('Post uploaded!', 'success');
      // Optionally: refresh feed or dashboard data
    } catch (e) {
      showToast('Failed to upload post', 'error');
    } finally {
      setIsPosting(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 text-white p-0 md:p-6 flex flex-col">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 mt-8 md:mt-0 px-6 md:px-0">
          <div className="mb-6 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2 drop-shadow-xl tracking-tight">Dashboard</h1>
            <p className="text-blue-100 text-lg md:text-xl drop-shadow">Welcome back! Here's what's happening in your network.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 rounded-xl shadow-lg font-semibold text-lg transition-all">
              <NotificationsActiveIcon />
              <span>Manage Notifications</span>
            </button>
            {/* User Profile Menu */}
            <div className="relative">
              <button
                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl shadow-lg transition-all"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <Avatar
                  src={session?.user?.image}
                  alt={session?.user?.name}
                  sx={{ width: 36, height: 36 }}
                />
                <span className="font-semibold text-lg">{session?.user?.name}</span>
                <KeyboardArrowDownIcon className={`transform transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>
              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white/10 backdrop-blur-xl rounded-xl shadow-2xl py-2 z-50 border border-white/20">
                  <Link href="/profile" className="flex items-center gap-2 px-4 py-3 hover:bg-white/20 transition-all rounded-xl">
                    <PersonIcon className="w-5 h-5" />
                    <span>View Profile</span>
                  </Link>
                  <Link href="/settings" className="flex items-center gap-2 px-4 py-3 hover:bg-white/20 transition-all rounded-xl">
                    <SettingsIcon className="w-5 h-5" />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center gap-2 px-4 py-3 hover:bg-white/20 transition-all rounded-xl text-red-400 w-full"
                  >
                    <LogoutIcon className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex gap-6 mb-8 border-b border-white/20 px-6 md:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={
                activeTab === tab.id
                  ? 'text-white border-b-4 border-blue-500 pb-4 px-2 font-bold text-lg transition-all'
                  : 'text-blue-200 hover:text-white pb-4 px-2 text-lg transition-all'
              }
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <div className="flex-1 px-0 md:px-0 pb-8">
          {renderTabContent()}
        </div>
      </div>
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
        <HomeButton />
        {/* Floating Post Button */}
        <button
          onClick={() => setShowPostModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-4 rounded-full shadow-xl font-bold text-lg transition-all focus:outline-none focus:ring-4 focus:ring-purple-300"
          aria-label="Create Post"
        >
          <AddIcon /> Post
        </button>
      </div>
      {/* Post Modal */}
      <Modal handleClose={() => setShowPostModal(false)} type="post" open={showPostModal}>
        <PostEditor onSubmit={handlePostSubmit} loading={isPosting} />
      </Modal>
      <AddEventModal
        open={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        onSave={handleAddEvent}
      />
    </div>
  );
}

function NotificationItem({ icon, title, time }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-[#252525] transition-colors">
      <div className="p-2 bg-[#252525] rounded-lg">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-gray-400 text-sm">{time}</p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-[#1D1D1D] border border-gray-800">
      <div className="p-2 bg-[#252525] rounded-lg">{icon}</div>
      <div>
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-gray-400 text-sm">{label}</p>
      </div>
    </div>
  );
}