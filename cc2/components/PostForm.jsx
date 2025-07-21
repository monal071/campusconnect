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
        <div className="modal-backdrop">
          <form onSubmit={handleNameSubmit} className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3 className="text-lg font-semibold">Enter your name to post</h3>
            </div>
            <div className="modal-body">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="input"
                placeholder="Your name"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary hover-lift">Continue</button>
            </div>
          </form>
        </div>
      )}
      <form onSubmit={handleSubmit} className="card p-4 animate-fade-in">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="input resize-none focus-ring"
          rows="3"
        />
        <div className="mt-3 flex justify-between items-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">{content.length} / 1000 characters</p>
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className={`btn ${
              !content.trim() || isSubmitting
                ? 'btn-disabled'
                : 'btn-primary hover-lift'
            }`}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </form>
    </>
  );
};

export default PostForm;