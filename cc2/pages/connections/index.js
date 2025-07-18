import { useState, useEffect } from 'react';

export default function ConnectionsPage() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [incoming, setIncoming] = useState([]);
  const [friends, setFriends] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get userId from localStorage, but fetch user info from DB if needed
    const id = localStorage.getItem('userId');
    setUserId(id);
    fetchIncoming(id);
    fetchFriends(id);
    fetchRecommendations(id);
  }, []);

  const fetchIncoming = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/connections/incoming?id=${id}`);
      const data = await res.json();
      setIncoming(data.incoming || []);
    } catch {}
  };
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
      if (!userId) {
        setMessage("You must be logged in to send requests.");
        return;
      }
      await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromUserId: userId, toUserId }),
      });
      setMessage('Connection request sent!');
    } catch {
      setMessage('Failed to send request.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4 text-indigo-800 dark:text-indigo-200">
          Connections
        </h1>
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-blue-700 dark:text-blue-300">
            Incoming Requests
          </h2>
          <ul className="mb-4">
            {incoming.length === 0 && (
              <li className="text-gray-400">No incoming requests.</li>
            )}
            {incoming.map(user => (
              <li key={user._id} className="py-1 text-gray-800 dark:text-gray-100">
                {user.name} ({user.email})
              </li>
            ))}
          </ul>
          <h2 className="text-lg font-semibold mb-2 text-green-700 dark:text-green-300">
            Current Friends
          </h2>
          <ul className="mb-4">
            {friends.length === 0 && <li className="text-gray-400">No friends yet.</li>}
            {friends.map(user => (
              <li key={user._id} className="py-1 text-gray-800 dark:text-gray-100">
                {user.name} ({user.email})
              </li>
            ))}
          </ul>
          <h2 className="text-lg font-semibold mb-2 text-purple-700 dark:text-purple-300">
            Recommendations
          </h2>
          <ul className="mb-4">
            {recommendations.length === 0 && <li className="text-gray-400">No recommendations.</li>}
            {recommendations.map(user => (
              <li key={user._id} className="py-1 flex items-center justify-between text-gray-800 dark:text-gray-100">
                <span>
                  {user.name} ({user.email})
                </span>
                <button
                  className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  onClick={() => handleConnect(user._id)}
                >
                  Connect
                </button>
              </li>
            ))}
          </ul>
        </div>
        <form onSubmit={handleSearch} className="flex mb-4">
          <input
            type="text"
            className="flex-1 rounded-l px-3 py-2 border border-gray-300 dark:border-gray-700 focus:outline-none dark:bg-gray-700 dark:text-gray-100"
            placeholder="Search users by name or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-r bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
          >
            Search
          </button>
        </form>
        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {message && <div className="text-center text-sm text-indigo-600 mb-2">{message}</div>}
        <ul className="max-h-60 overflow-y-auto">
          {users.map(user => (
            <li key={user._id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-800 dark:text-gray-100">
                {user.name} ({user.email})
              </span>
              <button
                className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                onClick={() => handleConnect(user._id)}
              >
                Connect
              </button>
            </li>
          ))}
        </ul>
        {users.length === 0 && !loading && <div className="text-center text-gray-400">No users found.</div>}
      </div>
    </div>
  );
}