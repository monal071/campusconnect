import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  StarIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

export default function ResourceRating({ resourceId, initialRating = null }) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(initialRating);
  const [userRating, setUserRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [review, setReview] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  useEffect(() => {
    if (resourceId) {
      fetchRating();
      fetchReviews();
    }
  }, [resourceId]);

  const fetchRating = async () => {
    try {
      const res = await fetch(`/api/resources/${resourceId}/rating`);
      if (res.ok) {
        const data = await res.json();
        setRating(data.rating);
        setUserRating(data.userRating);
      }
    } catch (error) {
      console.error('Failed to fetch rating:', error);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const res = await fetch(`/api/resources/${resourceId}/reviews`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleRating = async (value) => {
    if (!session?.user) {
      toast.error('Please login to rate this resource');
      return;
    }

    try {
      const res = await fetch(`/api/resources/${resourceId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value }),
      });

      if (res.ok) {
        const data = await res.json();
        setRating(data.rating);
        setUserRating(value);
        toast.success('Rating submitted!');
        
        // Show review modal if rating is 4 or 5 stars
        if (value >= 4 && !userRating) {
          setShowReviewModal(true);
        }
      } else {
        throw new Error('Failed to submit rating');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit rating');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!review.trim()) {
      toast.error('Please write a review');
      return;
    }

    try {
      const res = await fetch(`/api/resources/${resourceId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          review: review.trim(),
          rating: userRating,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReviews([data.review, ...reviews]);
        setReview('');
        setShowReviewModal(false);
        toast.success('Review posted!');
      } else {
        throw new Error('Failed to post review');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to post review');
    }
  };

  const renderStars = (count, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = interactive
            ? hoverRating >= star || (!hoverRating && userRating >= star)
            : count >= star;

          return (
            <button
              key={star}
              type="button"
              disabled={!interactive || !session?.user}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
              onClick={() => interactive && handleRating(star)}
              className={`transition-all ${
                interactive && session?.user
                  ? 'hover:scale-110 cursor-pointer'
                  : 'cursor-default'
              }`}
            >
              {filled ? (
                <StarSolidIcon className="w-6 h-6 text-yellow-400" />
              ) : (
                <StarIcon className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Rating Display */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Rating & Reviews
            </h3>
            {rating && (
              <div className="flex items-center gap-3">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {rating.average.toFixed(1)}
                </div>
                <div>
                  {renderStars(rating.average)}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {rating.count} {rating.count === 1 ? 'rating' : 'ratings'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rating Breakdown */}
          {rating && rating.breakdown && (
            <div className="space-y-1 text-sm">
              {[5, 4, 3, 2, 1].map(stars => {
                const count = rating.breakdown[stars] || 0;
                const percentage = rating.count > 0 ? (count / rating.count) * 100 : 0;
                
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-gray-600 dark:text-gray-400 w-3">
                      {stars}
                    </span>
                    <StarSolidIcon className="w-3 h-3 text-yellow-400" />
                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Rating */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {userRating ? 'Your rating:' : 'Rate this resource:'}
          </div>
          {renderStars(userRating || 0, true)}
          {!session?.user && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Login to rate this resource
            </p>
          )}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ChatBubbleLeftIcon className="w-5 h-5" />
            Reviews ({reviews.length})
          </h4>

          {session?.user && userRating && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Write Review
            </button>
          )}
        </div>

        {loadingReviews ? (
          <div className="text-center py-8 text-gray-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <ChatBubbleLeftIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(reviewItem => (
              <ReviewCard key={reviewItem._id} review={reviewItem} />
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowReviewModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Write a Review
            </h3>
            
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Rating
                </label>
                {renderStars(userRating || 0)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Review
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Share your experience with this resource..."
                  rows="5"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!review.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post Review
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ review }) {
  const [helpful, setHelpful] = useState(review.helpful || 0);
  const [userMarkedHelpful, setUserMarkedHelpful] = useState(false);

  const handleMarkHelpful = async () => {
    try {
      const res = await fetch(`/api/resources/reviews/${review._id}/helpful`, {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setHelpful(data.helpful);
        setUserMarkedHelpful(data.marked);
        toast.success(data.marked ? 'Marked as helpful' : 'Removed helpful mark');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to mark as helpful');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start gap-3">
        <img
          src={review.author.image || '/default-avatar.png'}
          alt={review.author.name}
          className="w-10 h-10 rounded-full flex-shrink-0"
        />

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {review.author.name}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <StarSolidIcon
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? 'text-yellow-400'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {review.verified && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircleIcon className="w-4 h-4" />
                Verified
              </div>
            )}
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
            {review.review}
          </p>

          <button
            onClick={handleMarkHelpful}
            className={`text-sm transition-colors ${
              userMarkedHelpful
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            Helpful ({helpful})
          </button>
        </div>
      </div>
    </motion.div>
  );
}
