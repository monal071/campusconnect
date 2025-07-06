import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function Posts() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (session?.user) {
      setUserId(session.user.id);
      setUserName(session.user.name);
    } else {
      setUserId(null);
      setUserName('');
    }
  }, [session]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load posts');
      setPosts(data.data || []);
    } catch (e) {
      alert('Failed to load posts');
    }
    setLoading(false);
  };

  useEffect(() => { loadPosts(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    if (!userId || !userName) return alert('You must be logged in to post');
    try {
      const author = { id: userId, name: userName };
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, author }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create post');
      setContent('');
      loadPosts();
    } catch (e) {
      alert('Failed to create post');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24, color: '#2d3748' }}>CampusConnect Posts</h1>
      {status === 'loading' ? (
        <div style={{ textAlign: 'center', color: '#888' }}>Loading session...</div>
      ) : session ? (
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          <input
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Share something with the community..."
            style={{ flex: 1, padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 16 }}
          />
          <button
            type="submit"
            style={{ padding: '10px 20px', borderRadius: 6, background: '#2563eb', color: '#fff', border: 'none', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
          >Post</button>
        </form>
      ) : (
        <div style={{ textAlign: 'center', color: '#888', marginBottom: 32 }}>
          You must be logged in to post.
        </div>
      )}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#888' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888' }}>No posts found.</div>
          ) : posts.map((p, i) => (
            <div key={i} style={{ background: '#f1f5f9', borderRadius: 8, padding: 18, boxShadow: '0 1px 4px #0001' }}>
              <div style={{ fontSize: 17, marginBottom: 8, color: '#222' }}>{p.content}</div>
              <div style={{ fontSize: 14, color: '#555', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{p.author?.name || 'Anonymous'}</span>
                <span style={{ color: '#94a3b8' }}>•</span>
                <span>{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}