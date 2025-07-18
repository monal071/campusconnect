import React, { useState } from 'react';

const ConnectModal = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/connections/users?q=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const data = await res.json();
      setResults(data.users || []);
    } catch (err) {
      setMessage('Error searching users.');
    }
    setLoading(false);
  };

  const handleConnect = async (userId) => {
    setMessage('');
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Network response was not ok');
      setMessage('Connection request sent!');
    } catch (err) {
      setMessage('Failed to send request.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
        <button className="absolute top-2 right-4 text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Connect with Users</h2>
        <form onSubmit={handleSearch} className="flex mb-4">
          <input
            type="text"
            className="flex-1 rounded-l px-3 py-2 border border-gray-300 dark:border-gray-700 focus:outline-none dark:bg-gray-800 dark:text-gray-100"
            placeholder="Search users by name or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="rounded-r bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700">Search</button>
        </form>
        {loading && <div className="text-center text-gray-500">Loading...</div>}
        {message && <div className="text-center text-sm text-indigo-600 mb-2">{message}</div>}
        <ul className="max-h-48 overflow-y-auto">
          {results.map(user => (
            <li key={user._id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
              <span className="text-gray-800 dark:text-gray-100">{user.name} ({user.email})</span>
              <button
                className="ml-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                onClick={() => handleConnect(user._id)}
              >
                Connect
              </button>
            </li>
          ))}
        </ul>
        {results.length === 0 && !loading && <div className="text-center text-gray-400">No users found.</div>}
      </div>
    </div>
  );
};

export default ConnectModal;
