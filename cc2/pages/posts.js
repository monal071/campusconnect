import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

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
    <div className="w-full min-h-screen pt-10 px-0">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-800 w-full max-w-none">
        <h1 className="text-3xl font-extrabold text-center text-indigo-800 dark:text-white mb-6 tracking-tight">CampusConnect Posts</h1>
        {status === 'loading' ? (
          <div className="text-center text-gray-400">Loading session...</div>
        ) : session ? (
          <form onSubmit={handleCreate} className="flex items-start gap-3 mb-8 animate-fadein w-full">
            <div className="flex-shrink-0">
              <Image src={session.user.image || '/logo.svg'} alt="avatar" width={44} height={44} className="rounded-full border border-gray-200 dark:border-gray-700" />
            </div>
            <div className="flex-1 w-full">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Share something with the community..."
                className="w-full min-h-[48px] max-h-40 p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-vertical transition"
                maxLength={500}
              />
              <div className="flex justify-end mt-2 w-full">
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow hover:scale-105 transition-transform disabled:opacity-50"
                  disabled={loading || !content.trim()}
                >
                  {loading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center text-gray-400 mb-8">You must be logged in to post.</div>
        )}
        {loading && posts.length === 0 ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <div className="flex flex-col gap-6 animate-fadein">
            {posts.length === 0 ? (
              <div className="text-center text-gray-400">No posts found.</div>
            ) : posts.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((p, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 shadow hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-800 group relative">
                <div className="flex items-center gap-3 mb-2">
                  <Image src={p.author?.image || '/logo.svg'} alt="avatar" width={36} height={36} className="rounded-full border border-gray-200 dark:border-gray-700" />
                  <div>
                    <div className="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-blue-700 transition-colors">{p.author?.name || 'Anonymous'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{p.createdAt ? new Date(p.createdAt).toLocaleString() : ''}</div>
                  </div>
                </div>
                <div className="text-lg text-gray-900 dark:text-gray-100 mb-1 whitespace-pre-line">{p.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <style jsx>{`
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadein { animation: fadein 0.5s; }
      `}</style>
    </div>
  );
}