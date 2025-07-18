import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';

export default function Dashboard() {
  const { data: session, update } = useSession();
  const [connections, setConnections] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState('');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
    }
  }, [session]);

  useEffect(() => {
    async function fetchConnections() {
      setLoading(true);
      try {
        const res = await fetch('/api/connections/users');
        if (!res.ok) throw new Error('Failed to fetch connections');
        const data = await res.json();
        setConnections(data.connections || []);
      } catch (e) {
        setError('Could not load connections');
      } finally {
        setLoading(false);
      }
    }
    fetchConnections();
  }, []);

  // Fetch a random motivational quote
  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await fetch('https://api.quotable.io/random');
        const data = await res.json();
        setQuote(data.content);
      } catch {
        setQuote('Welcome to your dashboard!');
      }
    }
    fetchQuote();
  }, []);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNameChange = (e) => setName(e.target.value);

  const saveName = async () => {
    setSaving(true);
    setError('');
    try {
      const userId = session?.user?.id;
      if (!userId) throw new Error('User ID not found');
      const res = await fetch(`/api/users?id=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to update name');
      if (update) await update();
      setEditing(false);
    } catch (e) {
      setError('Could not update name');
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900">
      <Head>
        <title>Dashboard | CampusConnect</title>
      </Head>
      <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl mx-auto mt-12 flex-1">
        {/* Profile Card */}
        <div className="flex flex-col items-center gap-6 bg-white/90 rounded-2xl shadow-xl p-8 w-full max-w-xs min-w-[300px]">
          <img
            src={session.user.image || '/default-profile.png'}
            alt="Profile"
            className="w-28 h-28 rounded-full border-4 border-indigo-400 shadow-lg mb-2"
          />
          <div className="flex flex-col items-center gap-2 w-full">
            {editing ? (
              <div className="flex flex-col items-center gap-2 w-full">
                <input
                  className="border border-indigo-300 rounded px-4 py-2 w-full text-center"
                  value={name}
                  onChange={handleNameChange}
                  disabled={saving}
                />
                <div className="flex gap-2">
                  <button
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                    onClick={saveName}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                    onClick={() => { setEditing(false); setName(session.user.name || ''); }}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </div>
                {error && <div className="text-red-600 text-sm mt-1">{error}</div>}
              </div>
            ) : (
              <>
                <div className="text-2xl font-semibold text-indigo-800">{name}</div>
                <button
                  className="mt-1 text-indigo-600 underline hover:text-indigo-800"
                  onClick={() => setEditing(true)}
                >
                  Change Name
                </button>
              </>
            )}
          </div>
          <div className="mt-4 w-full text-center">
            <div className="text-lg font-medium text-indigo-900 mb-1">Total Connections</div>
            {loading ? (
              <div className="text-gray-600">Loading...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : (
              <div className="text-3xl font-bold text-indigo-700">{connections.length}</div>
            )}
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-8 justify-between">
          {/* Welcome & Clock */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/80 rounded-2xl shadow-lg p-8">
            <div>
              <h2 className="text-2xl font-bold text-indigo-900 mb-2">Welcome, {name}!</h2>
              <p className="text-gray-700 text-lg max-w-md">{quote}</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-5xl font-mono text-indigo-700">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className="text-lg text-gray-600">{time.toLocaleDateString()}</span>
            </div>
          </div>
          {/* Quick Actions, Upcoming Events, News */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Quick Actions */}
            <div className="bg-white/80 rounded-2xl shadow-lg p-8 flex flex-col items-center">
              <h3 className="text-xl font-bold text-indigo-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-4 justify-center">
                <a href="/events" className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:scale-105 transition-transform">Events</a>
                <a href="/resources" className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold shadow-lg hover:scale-105 transition-transform">Resources</a>
                <a href="/jobs" className="px-6 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold shadow-lg hover:scale-105 transition-transform">Jobs</a>
                <a href="/posts" className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-bold shadow-lg hover:scale-105 transition-transform">Posts</a>
                <a href="/connections" className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-400 text-white font-bold shadow-lg hover:scale-105 transition-transform">Connections</a>
                <a href="/profile" className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-900 text-white font-bold shadow-lg hover:scale-105 transition-transform">Profile</a>
              </div>
            </div>
            {/* Upcoming Events */}
            <UpcomingEvents />
            {/* Announcements or News */}
            <div className="bg-white/80 rounded-2xl shadow-lg p-8 flex flex-col items-center">
              <h3 className="text-xl font-bold text-indigo-900 mb-4">Campus News</h3>
              <ul className="text-gray-700 list-disc pl-5 space-y-2">
                <li>New event: Tech Talk this Friday!</li>
                <li>Job fair registrations open now.</li>
                <li>Resource library updated with new materials.</li>
                <li>Check your connections for new friend requests.</li>
              </ul>
            </div>
          </div>
          {/* Footer */}
          <div className="text-center text-gray-600 text-sm mt-8">
            &copy; {new Date().getFullYear()} CampusConnect. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}

function UpcomingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      // Filter for upcoming events (date in future)
      const now = new Date();
      const upcoming = (data.data || []).filter(ev => new Date(ev.date) > now);
      // Sort by soonest
      upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(upcoming.slice(0, 5));
    } catch (e) {
      setError('Could not load events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return (
    <div className="bg-white/80 rounded-2xl shadow-lg p-8 flex flex-col items-center min-h-[300px] w-full">
      <h3 className="text-xl font-bold text-indigo-900 mb-4">Upcoming Events</h3>
      {loading ? (
        <div className="text-gray-600">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : events.length === 0 ? (
        <div className="text-gray-500">No upcoming events</div>
      ) : (
        <ul className="w-full space-y-3">
          {events.map(ev => (
            <li key={ev._id} className="flex flex-col bg-indigo-50 rounded-lg p-4 shadow">
              <div className="font-semibold text-indigo-800 text-lg">{ev.title}</div>
              <div className="text-gray-700 text-sm">{ev.description}</div>
              <div className="text-indigo-600 text-xs mt-1">{new Date(ev.date).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}