import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';

export default function Connect() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState({ receivedRequests: [], sentRequests: [] });

  useEffect(() => {
    if (session) {
      fetchRecommendedUsers();
      fetchRequests();
    }
  }, [session]);

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/connection-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchRecommendedUsers = async () => {
    try {
      const response = await fetch('/api/users/recommended');
      if (response.ok) {
        const data = await response.json();
        setRecommendedUsers(data);
      }
    } catch (error) {
      console.error('Error fetching recommended users:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      const response = await fetch('/api/connection-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiverId: userId.email }),
      });
      if (response.ok) {
        fetchRequests();
        fetchRecommendedUsers();
      }
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const response = await fetch('/api/connection-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action: 'accept' }),
      });
      if (response.ok) {
        fetchRequests();
        fetchRecommendedUsers();
      }
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await fetch('/api/connection-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action: 'reject' }),
      });
      if (response.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <p className="text-white">Please sign in to connect with others</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111]">
      <Head>
        <title>Connect - CampusConnect</title>
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Connect with People</h1>

        {/* Pending Requests */}
        {requests.receivedRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Connection Requests</h2>
            <div className="space-y-4">
              {requests.receivedRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-[#2D2D2D] rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1D1D1D] flex items-center justify-center overflow-hidden">
                      {request.sender.image ? (
                        <img
                          src={request.sender.image}
                          alt={request.sender.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xl">
                          {request.sender.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{request.sender.name}</h3>
                      <p className="text-gray-400 text-sm">{request.sender.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email"
                className="w-full bg-[#1D1D1D] text-white px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute left-3 top-3 text-gray-400">🔍</span>
            </div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Search
            </button>
          </form>
        </div>

        {/* Search Results */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="bg-[#2D2D2D] rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1D1D1D] flex items-center justify-center overflow-hidden">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xl">{user.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{user.name}</h3>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendRequest(user)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    disabled={requests.sentRequests.some(
                      (request) => request.receiverId === user.email
                    )}
                  >
                    {requests.sentRequests.some(
                      (request) => request.receiverId === user.email
                    )
                      ? 'Request Sent'
                      : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Recommended Users */}
        {recommendedUsers.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Recommended Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedUsers.map((user) => (
                <div
                  key={user._id}
                  className="bg-[#2D2D2D] rounded-lg p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#1D1D1D] flex items-center justify-center overflow-hidden">
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xl">{user.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{user.name}</h3>
                      <p className="text-gray-400 text-sm">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendRequest(user)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                    disabled={requests.sentRequests.some(
                      (request) => request.receiverId === user.email
                    )}
                  >
                    {requests.sentRequests.some(
                      (request) => request.receiverId === user.email
                    )
                      ? 'Request Sent'
                      : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}