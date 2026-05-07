import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { useVenueReviews, VenueReview } from '../hooks/useVenueReviews';

const StarIcon = ({ filled }: { filled: boolean }) => (
  <span className={`text-2xl transition-all ${filled ? 'text-yellow-400' : 'text-gray-300'}`}>
    ★
  </span>
);

export const VenueReviews = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { reviews, isLoading, submitReview, isSubmitting, averageRating, totalReviews } = useVenueReviews();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast('error', 'Please log in to submit a review');
      return;
    }

    try {
      await submitReview({ rating, comment, userId: user.id });
      showToast('success', 'Review submitted successfully!');
      setIsFormOpen(false);
      setRating(5);
      setComment('');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to submit review');
    }
  };

  return (
    <section className="bg-white py-12 md:py-16 border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">What Our Visitors Say</h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon key={star} filled={star <= Math.round(averageRating)} />
              ))}
            </div>
            <span className="text-lg font-semibold text-gray-700">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-gray-500">({totalReviews} reviews)</span>
          </div>
        </div>

        {!isFormOpen && (
          <div className="text-center mb-8">
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 bg-main-500 text-white px-8 py-3 rounded-full font-bold hover:bg-main-400 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-main-200"
            >
              <span>★</span>
              Write a Review
            </button>
          </div>
        )}

        {isFormOpen && (
          <div className="bg-main-50 p-6 md:p-8 rounded-2xl border border-main-200 mb-8">
            <h3 className="text-xl font-bold text-main-800 mb-4">Share Your Experience</h3>
            {user ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-main-700 mb-2 uppercase tracking-wide">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-4xl transition-all hover:scale-110 focus:outline-none ${
                          star <= rating ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-main-700 mb-2 uppercase tracking-wide">
                    Your Review
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-xl border border-main-200 p-4 h-32 focus:ring-2 focus:ring-main-500 focus:border-transparent text-gray-700 bg-white placeholder-gray-400 resize-none shadow-inner"
                    placeholder="What did you think about your experience at Spark Stage?"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-main-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-main-400 transition-colors disabled:opacity-50 shadow-md"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-3 rounded-xl font-bold text-main-700 hover:bg-main-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <span className="text-4xl text-main-300 mb-2 block">🔒</span>
                <p className="text-main-800 mb-6 font-medium">Please log in to write a review.</p>
                <div className="flex justify-center gap-4">
                  <Link
                    to="/login"
                    state={{ returnTo: '/on-stage' }}
                    className="bg-main-500 text-white px-8 py-3 rounded-full font-bold hover:bg-main-400 shadow-lg transition-transform hover:scale-105"
                  >
                    Log In
                  </Link>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-3 rounded-full font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main-500" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block p-4 rounded-full bg-main-50 mb-4">
              <span className="text-4xl">⭐</span>
            </div>
            <p className="text-gray-500 font-medium">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const ReviewCard = ({ review }: { review: VenueReview }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow duration-300">
    <div className="flex items-start gap-4 mb-4">
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="font-bold text-gray-900 text-lg">{review.user?.name}</h4>
          <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-full border border-gray-300">
            {new Date(review.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
        <div className="flex text-yellow-400 text-lg mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span key={`${review.id}-star-${star}`} className="drop-shadow-sm">
              {star <= review.rating ? '★' : '☆'}
            </span>
          ))}
        </div>
      </div>
    </div>
    {review.comment && (
      <div className="mt-2">
        <p className="text-gray-600 leading-relaxed italic">"{review.comment}"</p>
      </div>
    )}
  </div>
);
