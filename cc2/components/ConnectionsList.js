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
    return <div className="flex justify-center p-8"><div className="loading-spinner"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Send Connection Request */}
      <div className="card p-4 animate-fade-in">
        <h3 className="card-title mb-4">Send Connection Request</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Enter email address"
            className="input flex-1"
          />
          <button
            onClick={() => handleSendRequest(searchEmail)}
            className="btn btn-primary hover-lift"
            title="Send request"
          >
            <FaUserPlus className="mr-2" /> Send
          </button>
        </div>
      </div>

      {/* Pending Requests */}
      {requests.received.length > 0 && (
        <div className="card p-4 animate-fade-in">
          <h3 className="card-title mb-4">Pending Requests</h3>
          <div className="space-y-3">
            {requests.received.map((request) => (
              <div
                key={request._id}
                className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{request.senderId}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Sent {formatDate(request.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRequestAction(request._id, 'accept')}
                      className="btn-icon text-green-600 hover:text-green-500 hover-scale"
                      title="Accept"
                    >
                      <FaCheck />
                    </button>
                    <button
                      onClick={() => handleRequestAction(request._id, 'reject')}
                      className="btn-icon text-red-600 hover:text-red-500 hover-scale"
                      title="Reject"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests */}
      {requests.sent.length > 0 && (
        <div className="card p-4 animate-fade-in">
          <h3 className="card-title mb-4">Sent Requests</h3>
          <div className="space-y-3">
            {requests.sent.map((request) => (
              <div
                key={request._id}
                className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <p className="font-medium text-slate-900 dark:text-white">{request.receiverId}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Sent {formatDate(request.createdAt)}</p>
                <p className="text-sm mt-1">
                  <span className={`badge ${
                    request.status === 'pending' ? 'badge-warning' : 
                    request.status === 'accepted' ? 'badge-success' : 'badge-error'
                  }`}>
                    {request.status}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Connections */}
      <div className="card p-4 animate-fade-in">
        <h3 className="card-title mb-4">My Connections</h3>
        {connections.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center py-4">No connections yet</p>
        ) : (
          <div className="space-y-3">
            {connections.map((connection) => (
              <div
                key={connection._id}
                className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {editingId === connection._id ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1 space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="input"
                        placeholder="Connection Name"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">URL</label>
                      <input
                        type="text"
                        value={editForm.url}
                        onChange={(e) => setEditForm({ ...editForm, url: e.target.value })}
                        className="input"
                        placeholder="URL"
                      />
                    </div>
                    <div className="flex gap-2 mt-3 sm:mt-0">
                      <button
                        onClick={handleUpdate}
                        className="btn-icon text-green-600 hover:text-green-500 hover-scale"
                        title="Save"
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn-icon text-red-600 hover:text-red-500 hover-scale"
                        title="Cancel"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{connection.name}</h3>
                      <a
                        href={connection.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm transition-colors"
                      >
                        {connection.url}
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(connection)}
                        className="btn-icon text-blue-600 hover:text-blue-500 hover-scale"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(connection._id)}
                        className="btn-icon text-red-600 hover:text-red-500 hover-scale"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 