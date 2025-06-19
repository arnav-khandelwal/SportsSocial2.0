import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStar, FaThumbsUp, FaThumbsDown, FaPlus, FaFilter, FaUser, FaTags, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../utils/dateUtils';
import './Reviews.scss';

const Reviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'venue', label: 'Venues' },
    { value: 'event', label: 'Events' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'coaching', label: 'Coaching' },
    { value: 'app', label: 'App Experience' }
  ];

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [filter]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { category: filter } : {};
      const response = await axios.get('/reviews', { params });
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/reviews/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleVote = async (reviewId, voteType) => {
    try {
      await axios.post(`/reviews/${reviewId}/vote`, { voteType });
      
      // Update the review in state
      setReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            const updatedReview = { ...review };
            
            // Remove previous vote counts if user had voted
            if (review.user_vote === 'helpful') {
              updatedReview.helpful_votes = Math.max(0, updatedReview.helpful_votes - 1);
            } else if (review.user_vote === 'not_helpful') {
              updatedReview.not_helpful_votes = Math.max(0, updatedReview.not_helpful_votes - 1);
            }
            
            // Add new vote
            if (voteType === 'helpful') {
              updatedReview.helpful_votes += 1;
            } else {
              updatedReview.not_helpful_votes += 1;
            }
            
            updatedReview.user_vote = voteType;
            return updatedReview;
          }
          return review;
        })
      );
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleRemoveVote = async (reviewId) => {
    try {
      await axios.delete(`/reviews/${reviewId}/vote`);
      
      // Update the review in state
      setReviews(prevReviews => 
        prevReviews.map(review => {
          if (review.id === reviewId) {
            const updatedReview = { ...review };
            
            // Remove vote counts
            if (review.user_vote === 'helpful') {
              updatedReview.helpful_votes = Math.max(0, updatedReview.helpful_votes - 1);
            } else if (review.user_vote === 'not_helpful') {
              updatedReview.not_helpful_votes = Math.max(0, updatedReview.not_helpful_votes - 1);
            }
            
            updatedReview.user_vote = null;
            return updatedReview;
          }
          return review;
        })
      );
    } catch (error) {
      console.error('Failed to remove vote:', error);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={index}
        className={`reviews__star ${index < rating ? 'reviews__star--filled' : ''}`}
      />
    ));
  };

  const renderFilterContent = () => (
    <div className="reviews__filter-content">
      <div className="reviews__filter-group">
        <label>Category</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {categoryOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="reviews">
        <div className="reviews__loading">
          <div className="loader"></div>
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`reviews ${isFullscreen ? 'reviews--fullscreen' : ''}`}>
      <div className="reviews__main">
        <div className="reviews__header">
          <div className="reviews__title-section">
            <h1 className="reviews__title">Community Reviews</h1>
            <p className="reviews__subtitle">Share your sports experiences and help others</p>
          </div>
          <div className="reviews__header-actions">
            {isFullscreen && (
              <button
                className="reviews__filter-toggle reviews__filter-toggle--fullscreen"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter />
                Filters
              </button>
            )}
            <Link to="/create-review" className="reviews__create-btn">
              <FaPlus />
              Write Review
            </Link>
          </div>
        </div>

        {stats && (
          <div className="reviews__stats">
            <div className="reviews__stat">
              <h3>{stats.total}</h3>
              <p>Total Reviews</p>
            </div>
            <div className="reviews__stat">
              <h3>{stats.averageRating.toFixed(1)}</h3>
              <div className="reviews__stat-stars">
                {renderStars(Math.round(stats.averageRating))}
              </div>
              <p>Average Rating</p>
            </div>
          </div>
        )}

        {!isFullscreen && (
          <div className="reviews__filters">
            <button
              className="reviews__filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter />
              Filters
            </button>
            
            {showFilters && (
              <div className="reviews__filter-panel">
                {renderFilterContent()}
              </div>
            )}
          </div>
        )}

        <div className="reviews__content">
          {reviews.length === 0 ? (
            <div className="reviews__empty">
              <h3>No reviews found</h3>
              <p>
                {filter === 'all' 
                  ? "Be the first to share your sports experience!"
                  : `No reviews found in the ${categoryOptions.find(c => c.value === filter)?.label} category.`
                }
              </p>
              <Link to="/create-review" className="reviews__empty-cta">
                <FaPlus />
                Write the First Review
              </Link>
            </div>
          ) : (
            <div className="reviews__list">
              {reviews.map((review) => (
                <div key={review.id} className="reviews__card">
                  <div className="reviews__card-header">
                    <div className="reviews__author">
                      <Link 
                        to={`/profile/${review.author_id}`}
                        className="reviews__avatar-link"
                      >
                        <div className="reviews__avatar">
                          <FaUser />
                        </div>
                      </Link>
                      <div className="reviews__author-info">
                        <Link 
                          to={`/profile/${review.author_id}`}
                          className="reviews__author-link"
                        >
                          <h4 className="reviews__author-name">{review.author_username}</h4>
                        </Link>
                        <span className="reviews__time">{formatRelativeTime(review.created_at)}</span>
                      </div>
                    </div>
                    <div className="reviews__rating">
                      {renderStars(review.rating)}
                    </div>
                  </div>

                  <div className="reviews__card-content">
                    <div className="reviews__meta">
                      <span className="reviews__category">{review.category}</span>
                      {review.tags && review.tags.length > 0 && (
                        <div className="reviews__tags">
                          <FaTags className="reviews__tags-icon" />
                          {review.tags.map((tag, index) => (
                            <span key={index} className="reviews__tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="reviews__title-text">{review.title}</h3>
                    <p className="reviews__content-text">{review.content}</p>
                  </div>

                  <div className="reviews__card-footer">
                    <div className="reviews__votes">
                      <button
                        className={`reviews__vote-btn ${
                          review.user_vote === 'helpful' ? 'reviews__vote-btn--active' : ''
                        }`}
                        onClick={() => 
                          review.user_vote === 'helpful' 
                            ? handleRemoveVote(review.id)
                            : handleVote(review.id, 'helpful')
                        }
                      >
                        <FaThumbsUp />
                        <span>{review.helpful_votes}</span>
                      </button>
                      <button
                        className={`reviews__vote-btn ${
                          review.user_vote === 'not_helpful' ? 'reviews__vote-btn--active' : ''
                        }`}
                        onClick={() => 
                          review.user_vote === 'not_helpful' 
                            ? handleRemoveVote(review.id)
                            : handleVote(review.id, 'not_helpful')
                        }
                      >
                        <FaThumbsDown />
                        <span>{review.not_helpful_votes}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right sidebar for fullscreen mode */}
      {isFullscreen && (
        <>
          {showFilters && <div className="reviews__sidebar-overlay" onClick={() => setShowFilters(false)} />}
          <div className={`reviews__sidebar ${showFilters ? 'reviews__sidebar--open' : ''}`}>
            <div className="reviews__sidebar-header">
              <h3>Filters</h3>
              <button
                className="reviews__sidebar-close"
                onClick={() => setShowFilters(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="reviews__sidebar-content">
              {renderFilterContent()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Reviews;