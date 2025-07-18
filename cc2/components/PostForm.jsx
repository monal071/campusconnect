import { useState } from 'react';

const PostForm = ({ onSubmit, isGuest, guestName, setGuestName }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [tempName, setTempName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    // If guest and no name, prompt for name
    if (isGuest && !guestName) {
      setShowNamePrompt(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim(), guestName || tempName);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    setGuestName(tempName.trim());
    setShowNamePrompt(false);
    // After setting name, submit the post
    setTimeout(() => handleSubmit({ preventDefault: () => {} }), 0);
  };

  // If not logged in and not guest, don't show form
  if (!isGuest && typeof window !== 'undefined' && !localStorage.getItem('token') && !localStorage.getItem('userId')) return null;

  return (
    <>
      {showNamePrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <form onSubmit={handleNameSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col items-center">
            <label className="mb-2 text-lg font-semibold">Enter your name to post:</label>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="mb-4 px-3 py-2 border rounded w-64 dark:bg-gray-700 dark:text-white"
              placeholder="Your name"
              autoFocus
            />
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Continue</button>
          </form>
        </div>
      )}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          rows="3"
        />
        <div className="mt-3 flex justify-between items-center">
          <p className="text-sm text-gray-500">{content.length} / 1000 characters</p>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${!content.trim() || isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </>
  );
};

export default PostForm;