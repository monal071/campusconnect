import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaUserPlus, FaUserMinus } from 'react-icons/fa';
import { formatDate } from '../util/dateFormat';

export default function ConnectionsList() {
  const { data: session } = useSession();
  const [connections, setConnections] = useState([]);
  const [requests, setRequests] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', url: '' });
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    if (session) {
      fetchConnections();
      fetchRequests();
    }
  }, [session]);

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/connections');
      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/connections/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setConnections(connections.filter(conn => conn._id !== id));
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
    }
  };

  const handleSendRequest = async (email) => {
    try {
      const response = await fetch('/api/connection-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiverId: email }),
      });
      if (response.ok) {
        fetchRequests();
        setSearchEmail('');
      }
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      const response = await fetch('/api/connection-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, action }),
      });
      if (response.ok) {
        fetchRequests();
        fetchConnections();
      }
    } catch (error) {
      console.error('Error handling request:', error);
    }
  };

  const handleEdit = (connection) => {
    setEditingId(connection._id);
    setEditForm({ name: connection.name, url: connection.url });
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/connections/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      if (response.ok) {
        setConnections(connections.map(conn => 
          conn._id === editingId ? { ...conn, ...editForm } : conn
        ));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error updating connection:', error);
    }
  };

  if (loading) {
    return <p className="text-white text-center">Loading connections...</p>;
  }

  return (
    <div className="space-y-6">
      {/* Send Connection Request */}
      <div className="bg-[#2D2D2D] rounded-lg p-4">
        <h3 className="text-white font-medium mb-2">Send Connection Request</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Enter email address"
            className="bg-[#1D1D1D] text-white px-3 py-2 rounded flex-1"
          />
          <button
            onClick={() => handleSendRequest(searchEmail)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            <FaUserPlus />
          </button>
        </div>
      </div>

      {/* Pending Requests */}
      {requests.received.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-white font-medium">Pending Requests</h3>
          {requests.received.map((request) => (
            <div
              key={request._id}
              className="bg-[#2D2D2D] rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="text-white">{request.senderId}</p>
                <p className="text-gray-400 text-sm">Sent {formatDate(request.createdAt)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRequestAction(request._id, 'accept')}
                  className="text-green-500 hover:text-green-400"
                >
                  <FaCheck />
                </button>
                <button
                  onClick={() => handleRequestAction(request._id, 'reject')}
                  className="text-red-500 hover:text-red-400"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sent Requests */}
      {requests.sent.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-white font-medium">Sent Requests</h3>
          {requests.sent.map((request) => (
            <div
              key={request._id}
              className="bg-[#2D2D2D] rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <p className="text-white">{request.receiverId}</p>
                <p className="text-gray-400 text-sm">Sent {formatDate(request.createdAt)}</p>
                <p className="text-gray-400 text-sm">Status: {request.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing Connections */}
      <div className="space-y-4">
        <h3 className="text-white font-medium">My Connections</h3>
        {connections.length === 0 ? (
          <p className="text-white text-center">No connections yet</p>
        ) : (
          connections.map((connection) => (
            <div
              key={connection._id}
              className="bg-[#2D2D2D] rounded-lg p-4 flex items-center justify-between"
            >
              {editingId === connection._id ? (
                <div className="flex-1 flex gap-4">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="bg-[#1D1D1D] text-white px-3 py-1 rounded flex-1"
                    placeholder="Connection Name"
                  />
                  <input
                    type="text"
                    value={editForm.url}
                    onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                    className="bg-[#1D1D1D] text-white px-3 py-1 rounded flex-1"
                    placeholder="URL"
                  />
                  <button
                    onClick={handleUpdate}
                    className="text-green-500 hover:text-green-400"
                  >
                    <FaCheck />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{connection.name}</h3>
                    <a
                      href={connection.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      {connection.url}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(connection)}
                      className="text-blue-500 hover:text-blue-400"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(connection._id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 