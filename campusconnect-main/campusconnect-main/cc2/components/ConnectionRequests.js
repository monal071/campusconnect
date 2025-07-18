import { useState, useEffect } from 'react';
import { Avatar } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function ConnectionRequests() {
  const [requests, setRequests] = useState({ receivedRequests: [], sentRequests: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/connection-requests');
      if (!response.ok) throw new Error('Failed to fetch requests');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      setError('Error loading connection requests');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId, action) => {
    try {
      const response = await fetch('/api/connection-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action }),
      });

      if (!response.ok) throw new Error('Failed to update request');
      
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
      {/* Received Requests */}
      <div className="bg-[#1D2226] rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <PersonAddIcon className="text-blue-500" />
          Connection Requests
        </h2>
        
        {requests.receivedRequests.length === 0 ? (
          <p className="text-gray-400 text-sm">No pending connection requests</p>
        ) : (
          <div className="space-y-4">
            {requests.receivedRequests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between bg-[#2D2D2D] p-3 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={request.sender.image}
                    alt={request.sender.name}
                    className="!w-10 !h-10"
                  />
                  <div>
                    <h3 className="font-medium">{request.sender.name}</h3>
                    <p className="text-sm text-gray-400">{request.sender.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRequest(request._id, 'accept')}
                    className="p-2 text-green-500 hover:bg-green-500/10 rounded-full transition-colors"
                    title="Accept"
                  >
                    <CheckCircleIcon />
                  </button>
                  <button
                    onClick={() => handleRequest(request._id, 'reject')}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    title="Reject"
                  >
                    <CancelIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Requests */}
      {requests.sentRequests.length > 0 && (
        <div className="bg-[#1D2226] rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Sent Requests</h2>
          <div className="space-y-4">
            {requests.sentRequests.map((request) => (
              <div
                key={request._id}
                className="flex items-center justify-between bg-[#2D2D2D] p-3 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={request.receiver.image}
                    alt={request.receiver.name}
                    className="!w-10 !h-10"
                  />
                  <div>
                    <h3 className="font-medium">{request.receiver.name}</h3>
                    <p className="text-sm text-gray-400">{request.receiver.email}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-400">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
} 