import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { fetchJSON } from '../utils/fetch-json';

export default function Posts() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const requestRef = useRef(null);
  const creating = useRef(false);

  const loadPosts = useCallback(async (nextPage = 1) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const data = await fetchJSON(`/api/posts?page=${nextPage}`, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setPosts((previous) => nextPage === 1 ? data.data || [] : [...new Map([...previous, ...(data.data || [])].map((post) => [post._id, post])).values()]);
      setPage(nextPage);
      setHasMore(!!data.hasMore);
    } catch (error) {
      if (!controller.signal.aborted) setError(error.message);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    return () => requestRef.current?.abort();
  }, [loadPosts]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!content.trim() || creating.current || !session?.user) return;
    creating.current = true;
    setSubmitting(true);
    setError('');
    try {
      await fetchJSON('/api/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });
      setContent('');
      await loadPosts();
    } catch (error) { setError(error.message); }
    finally { creating.current = false; setSubmitting(false); }
  };

  return (
    <div className="w-full max-w-3xl mx-auto min-h-screen py-8 px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-800 w-full max-w-none">
        <h1 className="text-3xl font-extrabold text-center text-indigo-800 dark:text-white mb-6 tracking-tight">CampusConnect Posts</h1>
        {error && <div role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-800"><p>{error}</p><button onClick={() => loadPosts()} className="mt-2 font-semibold underline">Reload posts</button></div>}
        {status === 'loading' ? (
          <div className="text-center text-gray-400">Loading session...</div>
        ) : session ? (
          <form onSubmit={handleCreate} className="flex items-start gap-3 mb-8 animate-fadein w-full">
            <div className="flex-shrink-0">
              <Image src={session.user.image || '/logo.svg'} alt="avatar" width={44} height={44} className="rounded-full border border-gray-200 dark:border-gray-700" />
            </div>
            <div className="flex-1 w-full">
              <textarea
                aria-label="Write a post"
                disabled={submitting}
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
                  disabled={submitting || !content.trim()}
                >
                  {submitting ? 'Posting...' : 'Post'}
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
            ) : posts.map((p) => (
              <div key={p._id} className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 shadow hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-800 group relative">
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
      {hasMore && <div className="mb-8 text-center"><button onClick={() => loadPosts(page + 1)} disabled={loading} className="rounded-lg border border-indigo-400 px-6 py-3 text-indigo-600 dark:text-indigo-300 disabled:opacity-50">{loading ? 'Loading...' : 'Load more posts'}</button></div>}
      <style jsx>{`
        @keyframes fadein { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadein { animation: fadein 0.5s; }
      `}</style>
    </div>
  );
}