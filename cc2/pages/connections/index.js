import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ConnectionRequests from '../../components/ConnectionRequests';

export default function ConnectionsPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [friends, setFriends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [userId, setUserId] = useState(null);

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
      const res = await fetch(`/api/connections/friends?id=${id}`);
      const data = await res.json();
      setFriends(data.friends || []);
    } catch {}
  };

  const fetchRecommendations = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/connections/recommendations?id=${id}`);
      const data = await res.json();
      setRecommendations(data.recommendations || []);
    } catch {}
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(
        `/api/connections/users?q=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setMessage('Error searching users.');
    }
    setLoading(false);
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
    } catch (error) {
      console.error('Error sending connection request:', error);
      setMessage(error.message || 'Failed to send request.');
    }
  };

  return (
      <div className="min-h-screen p-4">
        <div className="w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connection Requests Section */}
          <div className="md:col-span-1">
            <ConnectionRequests />
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Current Friends */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                My Connections
              </h2>
              {friends.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No connections yet</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {friends.map(user => (
                    <div key={user._id} className="flex items-center space-x-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                      <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-10 h-10 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-300 font-bold">
                          {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Recommendations */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                People You May Know
              </h2>
              {recommendations.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No recommendations available</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendations.map(user => (
                    <div key={user._id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-10 h-10 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-300 font-bold">
                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(user._id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Search Users */}
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Find People
              </h2>
              <form onSubmit={handleSearch} className="flex mb-4">
                <input
                  type="text"
                  className="flex-1 rounded-l px-3 py-2 border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Search by name or email"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="rounded-r bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>
              
              {message && (
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  {message}
                </div>
              )}
              
              {users.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {users.map(user => (
                    <div key={user._id} className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900 rounded-full w-10 h-10 flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-300 font-bold">
                            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleConnect(user._id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  {loading ? 'Searching...' : search && !loading ? 'No users found' : 'Search for users to connect with'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}