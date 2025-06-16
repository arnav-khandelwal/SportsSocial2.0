import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaClock, FaUsers, FaHeart, FaTags, FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';
import './PostCard.scss';

const PostCard = ({ post, onInterest }) => {
  const { user } = useAuth();
  const [isInterested, setIsInterested] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if current user has already shown interest in this post
    if (post.interested_users && user) {
      const userHasInterest = post.interested_users.some(
        interest => interest.user_id === user.id
      );
      setIsInterested(userHasInterest);
    }
  }, [post.interested_users, user]);

  const handleInterest = async () => {
    if (isInterested || loading) return;
    
    setLoading(true);
    try {
      await onInterest(post.id);
      setIsInterested(true);
    } catch (error) {
      console.error('Failed to show interest:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-card">
      <div className="post-card__header">
        <div className="post-card__author">
          <Link 
            to={`/profile/${post.author?.id || post.author_id}`}
            className="post-card__avatar-link"
          >
            <div className="post-card__avatar">
              <FaUser />
            </div>
          </Link>
          <div className="post-card__author-info">
            <Link 
              to={`/profile/${post.author?.id || post.author_id}`}
              className="post-card__author-link"
            >
              <h4 className="post-card__author-name">{post.author?.username || 'Unknown User'}</h4>
            </Link>
            <span className="post-card__time">{formatRelativeTime(post.created_at || post.createdAt)}</span>
          </div>
        </div>
        <div className="post-card__sport-badge">
          {post.sport}
        </div>
      </div>

      <div className="post-card__content">
        <h3 className="post-card__title">{post.heading}</h3>
        <p className="post-card__description">{post.description}</p>

        {post.tags && post.tags.length > 0 && (
          <div className="post-card__tags">
            <FaTags className="post-card__tags-icon" />
            {post.tags.map((tag, index) => (
              <span key={index} className="post-card__tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="post-card__details">
        <div className="post-card__detail">
          <FaMapMarkerAlt className="post-card__detail-icon" />
          <span className="post-card__location-name">{post.location_name || post.locationName}</span>
          {post.distance && (
            <span className="post-card__distance">
              ({(post.distance / 1000).toFixed(1)}km away)
            </span>
          )}
        </div>

        <div className="post-card__detail">
          <FaClock className="post-card__detail-icon" />
          <span>{formatDateTime(post.event_time || post.eventTime)}</span>
        </div>

        <div className="post-card__detail">
          <FaUsers className="post-card__detail-icon" />
          <span>{post.players_needed || post.playersNeeded} players needed</span>
        </div>
      </div>

      <div className="post-card__footer">
        <div className="post-card__interested">
          <FaHeart className="post-card__heart" />
          <span>{(post.interested_users || post.interestedUsers || []).length} interested</span>
        </div>

        <button
          className={`post-card__interest-btn ${isInterested ? 'post-card__interest-btn--interested' : ''}`}
          onClick={handleInterest}
          disabled={isInterested || loading}
        >
          {loading ? 'Processing...' : isInterested ? 'Interested' : 'I\'m Interested'}
        </button>
      </div>
    </div>
  );
};

export default PostCard;