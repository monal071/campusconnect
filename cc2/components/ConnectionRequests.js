import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ConnectionRequests() {
  const { data: session } = useSession();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchRequests();
    }
  }, [session]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const userId = session.user.id;
      const response = await fetch(`/api/connections/incoming?id=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setIncomingRequests(data.incoming || []);
    } catch (error) {
      setError('Error loading connection requests');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (fromUserId, action) => {
    try {
      setMessage('');
      const response = await fetch('/api/connections/request', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fromUserId, 
          toUserId: session.user.id,
          action 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update request');
      }
      
      setMessage(action === 'accept' ? 'Connection accepted!' : 'Request rejected');
      // Refresh requests after action
      fetchRequests();
    } catch (error) {
      setError('Error updating connection request');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
        Connection Requests
      </h2>
      
      {message && (
        <div className="text-green-600 dark:text-green-400 mb-4">
          {message}
        </div>
      )}
      
      {error && (
        <div className="text-red-600 dark:text-red-400 mb-4">
          {error}
        </div>
      )}
      
      {incomingRequests.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No pending connection requests</p>
      ) : (
        <div className="space-y-4">
          {incomingRequests.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4"
            >
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
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRequest(user._id.toString(), 'accept')}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  title="Accept"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRequest(user._id.toString(), 'reject')}
                  className="px-3 py-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                  title="Reject"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}