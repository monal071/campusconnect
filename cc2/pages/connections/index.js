import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import ConnectionRequests from '../../components/ConnectionRequests';
import ChatModal from '../../components/ChatModal';
import Image from 'next/image';

// Material UI Icons
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import DeleteIcon from '@mui/icons-material/Delete';

export default function ConnectionsPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [friends, setFriends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [userId, setUserId] = useState(null);
  const [sentRequests, setSentRequests] = useState(new Set());
  const [chatModal, setChatModal] = useState({ isOpen: false, participant: null });

  useEffect(() => {
    if (session?.user?.id) {
      // Get userId from the session instead of localStorage
      const id = session.user.id;
      setUserId(id);
      fetchFriends(id);
      fetchRecommendations(id);
    }
  }, [session]);

  const fetchFriends = async (id) => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/connections/friends?id=${id}`);
      const data = await res.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/connections/recommendations?id=${id}`);
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    
    setSearchLoading(true);
    setMessage('');
    try {
      const res = await fetch(
        `/api/connections/users?q=${encodeURIComponent(search.trim())}`
      );
      const data = await res.json();
      
      if (res.ok) {
        // Filter out current user from search results
        const filteredUsers = (data.users || []).filter(user => 
          user._id !== session?.user?.id
        );
        setUsers(filteredUsers);
      } else {
        setMessage(data.message || 'Error searching users.');
        setUsers([]);
      }
    } catch (error) {
      setMessage('Error searching users.');
      setUsers([]);
    }
    setSearchLoading(false);
  };

  const handleConnect = async (toUserId) => {
    setMessage("");
    try {
      if (!session?.user?.id) {
        setMessage("You must be logged in to send requests.");
        return;
      }
      
      const fromUserId = session.user.id;
      
      const response = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId, toUserId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send request');
      }
      
      setMessage('Connection request sent!');
      setSentRequests(prev => new Set([...prev, toUserId]));
      
      // Refresh recommendations to remove the user we just sent a request to
      fetchRecommendations(fromUserId);
    } catch (error) {
      console.error('Error sending connection request:', error);
      setMessage(error.message || 'Failed to send request.');
    }
  };

  const handleRemoveConnection = async (friendId) => {
    if (!confirm('Are you sure you want to remove this connection?')) {
      return;
    }
    
    setMessage("");
    try {
      if (!session?.user?.id) {
        setMessage("You must be logged in to remove connections.");
        return;
      }
      
      const userId = session.user.id;
      
      const response = await fetch('/api/connections/request', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId1: userId, userId2: friendId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove connection');
      }
      
      setMessage('Connection removed successfully');
      
      // Refresh friends list and recommendations
      fetchFriends(userId);
      fetchRecommendations(userId);
    } catch (error) {
      console.error('Error removing connection:', error);
      setMessage(error.message || 'Failed to remove connection.');
    }
  };

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleStartChat = (user) => {
    setChatModal({ 
      isOpen: true, 
      participant: user 
    });
  };

  const closeChatModal = () => {
    setChatModal({ isOpen: false, participant: null });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            <PeopleIcon className="inline-block mr-3 text-indigo-600" />
            Connections
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Build your network and connect with your campus community
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Connection Requests Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <ConnectionRequests />
          </motion.div>
          
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 space-y-8"
          >
            {/* Search Users */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <SearchIcon className="mr-2 text-indigo-600" />
                Find People
              </h2>
              <form onSubmit={handleSearch} className="flex mb-4">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Search by name or email"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-indigo-600 text-white rounded-r-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  disabled={searchLoading}
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </form>
              
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg mb-4 ${
                    message.includes('sent') || message.includes('accepted')
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}
                >
                  {message.includes('sent') && <CheckCircleIcon className="inline-block mr-2 w-5 h-5" />}
                  {message}
                </motion.div>
              )}
              
              {users.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {users.map((user, index) => (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {getUserInitials(user.name)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          {user.department && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">{user.department}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(user._id)}
                        disabled={sentRequests.has(user._id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          sentRequests.has(user._id)
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <PersonAddIcon className="inline-block mr-1 w-4 h-4" />
                        {sentRequests.has(user._id) ? 'Sent' : 'Connect'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <SearchIcon className="mx-auto w-12 h-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchLoading ? 'Searching...' : 
                     search && !searchLoading ? 'No users found' : 
                     'Search for users to connect with'}
                  </p>
                </div>
              )}
            </div>

            {/* Current Friends */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
                <PeopleIcon className="mr-2 text-indigo-600" />
                My Connections ({friends.length})
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Loading connections...</span>
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8">
                  <PeopleIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No connections yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Start connecting with people in your campus community
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {friends.map((user, index) => (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {getUserInitials(user.name)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          {user.department && (
                            <p className="text-xs text-green-600 dark:text-green-400">{user.department}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleStartChat(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Start Chat"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                        <div className="text-green-500">
                          <CheckCircleIcon className="w-6 h-6" />
                        </div>
                        <button
                          onClick={() => handleRemoveConnection(user._id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Remove Connection"
                        >
                          <PersonRemoveIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Recommendations */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
                <PersonAddIcon className="mr-2 text-indigo-600" />
                People You May Know
              </h2>
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <PersonAddIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No recommendations available</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    We'll suggest people for you to connect with as more users join
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((user, index) => (
                    <motion.div
                      key={user._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {getUserInitials(user.name)}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          {user.department && (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">{user.department}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(user._id)}
                        disabled={sentRequests.has(user._id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          sentRequests.has(user._id)
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <PersonAddIcon className="inline-block mr-1 w-4 h-4" />
                        {sentRequests.has(user._id) ? 'Sent' : 'Connect'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Chat Modal */}
      <ChatModal
        isOpen={chatModal.isOpen}
        onClose={closeChatModal}
        participant={chatModal.participant}
      />
    </div>
  );
}