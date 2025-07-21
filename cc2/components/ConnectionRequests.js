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
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="card p-4 animate-fade-in">
      <h2 className="card-title">
        Connection Requests
      </h2>
      
      {message && (
        <div className="alert alert-success mb-4">
          {message}
        </div>
      )}
      
      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}
      
      {incomingRequests.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400">No pending connection requests</p>
      ) : (
        <div className="space-y-4 mt-4">
          {incomingRequests.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="avatar avatar-initial">
                  <span>
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-white">{user.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRequest(user._id.toString(), 'accept')}
                  className="btn btn-success btn-sm hover-lift"
                  title="Accept"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRequest(user._id.toString(), 'reject')}
                  className="btn btn-secondary btn-sm hover-lift"
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