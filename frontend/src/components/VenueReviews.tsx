import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';
import { useVenueReviews, VenueReview } from '../hooks/useVenueReviews';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviewsPerPage = 4;
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const startIndex = currentIndex * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const currentReviews = reviews.slice(startIndex, endIndex);

  const handleNext = () => {
    if (currentIndex < totalPages - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(totalPages - 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  useEffect(() => {
    if (reviews.length <= reviewsPerPage) return;
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentIndex, reviews.length]);

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
    <section className="bg-white py-8 md:py-12 lg:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 md:mb-10">
          <div className="inline-block mb-3 md:mb-4 animate-bounce">
            <span className="text-4xl md:text-5xl">💖</span>
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 md:mb-3">What Our Visitors Love</h2>
          <p className="text-gray-600 text-sm md:text-base lg:text-lg">5-star reviews from our happy visitors</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mt-3 md:mt-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon key={star} filled={star <= 5} />
              ))}
            </div>
            <span className="text-base md:text-lg font-semibold text-main-600">
              {averageRating.toFixed(1)}
            </span>
            <span className="text-gray-500 text-sm md:text-base">({totalReviews} five-star reviews)</span>
          </div>
        </div>

        {!isFormOpen && (
          <div className="text-center mb-6 md:mb-8">
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 bg-main-500 text-white px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-bold hover:bg-main-400 transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-main-200 animate-fade-in"
            >
              <span>✨</span>
              Share Your Experience
            </button>
          </div>
        )}

        {isFormOpen && (
          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-2xl border-2 border-main-200 shadow-xl mb-6 md:mb-8 animate-fade-in-up">
            <div className="text-center mb-4 md:mb-6">
              <span className="text-3xl md:text-4xl">💬</span>
              <h3 className="text-lg md:text-xl font-bold text-main-800 mt-2">Share Your Experience</h3>
            </div>
            {user ? (
              <form onSubmit={handleSubmit}>
                <div className="mb-4 md:mb-6">
                  <label className="block text-xs md:text-sm font-bold text-main-700 mb-2 uppercase tracking-wide">
                    Rating
                  </label>
                  <div className="flex gap-1 md:gap-2 justify-center sm:justify-start">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-3xl md:text-4xl transition-all hover:scale-110 focus:outline-none ${
                          star <= rating ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-4 md:mb-6">
                  <label className="block text-xs md:text-sm font-bold text-main-700 mb-2 uppercase tracking-wide">
                    Your Review
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-xl border border-main-200 p-3 md:p-4 h-24 md:h-32 text-sm md:text-base focus:ring-2 focus:ring-main-500 focus:border-transparent text-gray-700 bg-white placeholder-gray-400 resize-none shadow-inner"
                    placeholder="What did you think about your experience at Spark Stage?"
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-main-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl text-sm md:text-base font-bold hover:bg-main-400 transition-colors disabled:opacity-50 shadow-md"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 md:px-6 py-2 md:py-3 rounded-xl text-sm md:text-base font-bold text-main-700 hover:bg-main-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 md:py-8">
                <span className="text-3xl md:text-4xl text-main-300 mb-2 block">🔒</span>
                <p className="text-main-800 mb-4 md:mb-6 font-medium text-sm md:text-base">Please log in to write a review.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    to="/login"
                    state={{ returnTo: '/on-stage' }}
                    className="bg-main-500 text-white px-6 md:px-8 py-2 md:py-3 rounded-full text-sm md:text-base font-bold hover:bg-main-400 shadow-lg transition-transform hover:scale-105"
                  >
                    Log In
                  </Link>
                  <button
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-bold text-gray-500 hover:bg-gray-100 transition-colors"
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
          <div className="text-center py-8 md:py-12">
            <div className="inline-block p-4 md:p-6 rounded-full bg-gradient-to-br from-main-100 to-main-50 mb-3 md:mb-4">
              <span className="text-4xl md:text-5xl">💫</span>
            </div>
            <p className="text-gray-500 font-medium text-sm md:text-base lg:text-lg">Be the first to share your 5-star experience!</p>
          </div>
        ) : (
          <div className="relative">
            {totalPages > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-4 z-20 bg-white/90 hover:bg-white text-main-600 p-2 md:p-3 rounded-full shadow-lg transition-all hover:scale-110 hidden md:flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-4 z-20 bg-white/90 hover:bg-white text-main-600 p-2 md:p-3 rounded-full shadow-lg transition-all hover:scale-110 hidden md:flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </button>
              </>
            )}

            <div 
              className="overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 transition-all duration-500 ease-in-out">
                {currentReviews.map((review, index) => (
                  <ReviewCard key={review.id} review={review} index={index} />
                ))}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4 md:hidden">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentIndex === idx ? 'bg-main-500' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to page ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4 text-sm text-gray-500 hidden md:flex">
                <span>{currentIndex + 1}</span>
                <span>/</span>
                <span>{totalPages}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

const ReviewCard = ({ review, index }: { review: VenueReview; index: number }) => (
  <div 
    className="bg-gradient-to-br from-white to-main-50 rounded-xl border-2 border-main-100 p-3 md:p-4 hover:shadow-xl hover:border-main-200 transition-all duration-300 relative overflow-hidden animate-fade-in-up h-full"
    style={{
      animationDelay: `${index * 100}ms`,
      animationFillMode: 'both'
    }}
  >
    <div className="absolute top-1 md:top-2 right-1 md:right-2 text-2xl md:text-3xl opacity-20 animate-pulse">💖</div>
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex items-start gap-2 md:gap-3 mb-2 md:mb-3">
        <div className="flex-1">
          <div className="flex flex-col gap-1 mb-1 md:mb-2">
            <h4 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-1 md:gap-2">
              <span className="text-lg md:text-xl">⭐</span>
              <span className="truncate">{review.user?.name}</span>
            </h4>
            <span className="text-xs text-gray-400 font-medium bg-white px-2 py-0.5 rounded-full border border-main-100 shadow-sm">
              {new Date(review.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <div className="flex text-yellow-400 text-sm md:text-base">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={`${review.id}-star-${star}`} className="drop-shadow-sm">
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
      {review.comment && (
        <div className="mt-1 md:mt-2 flex-grow">
          <p className="text-gray-700 leading-relaxed text-xs md:text-sm line-clamp-3">"{review.comment}"</p>
        </div>
      )}
      <div className="mt-2 md:mt-3 flex items-center gap-1 md:gap-2 text-main-500">
        <span className="text-base md:text-lg">💕</span>
        <span className="text-xs md:text-sm font-semibold">Loved it!</span>
      </div>
    </div>
  </div>
);
