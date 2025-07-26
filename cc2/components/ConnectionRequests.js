import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';

// Material UI Icons
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';

export default function ConnectionRequests() {
  const { data: session } = useSession();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [processingRequest, setProcessingRequest] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchRequests();
    }
  }, [session]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
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
      setError(null);
      setProcessingRequest(fromUserId);
      
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
      
      // Remove the processed request from the list
      setIncomingRequests(prev => prev.filter(user => user._id !== fromUserId));
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setError('Error updating connection request');
      console.error('Error:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const getUserInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading requests...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
        <NotificationsIcon className="mr-2 text-indigo-600" />
        Connection Requests
        {incomingRequests.length > 0 && (
          <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {incomingRequests.length}
          </span>
        )}
      </h2>
      
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 mb-4 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        >
          <CheckIcon className="inline-block mr-2 w-5 h-5" />
          {message}
        </motion.div>
      )}
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 mb-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"
        >
          <CloseIcon className="inline-block mr-2 w-5 h-5" />
          {error}
        </motion.div>
      )}
      
      {incomingRequests.length === 0 ? (
        <div className="text-center py-8">
          <NotificationsIcon className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">No pending requests</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Connection requests will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {incomingRequests.map((user, index) => (
            <motion.div
              key={user._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center space-x-4 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {getUserInitials(user.name)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{user.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  {user.department && (
                    <p className="text-xs text-purple-600 dark:text-purple-400">{user.department}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleRequest(user._id.toString(), 'accept')}
                  disabled={processingRequest === user._id}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingRequest === user._id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      <CheckIcon className="inline-block mr-1 w-4 h-4" />
                      Accept
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleRequest(user._id.toString(), 'reject')}
                  disabled={processingRequest === user._id}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingRequest === user._id ? 'Processing...' : (
                    <>
                      <CloseIcon className="inline-block mr-1 w-4 h-4" />
                      Decline
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}