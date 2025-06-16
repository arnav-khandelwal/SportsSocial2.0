import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaMapMarkerAlt, FaUsers, FaHeart, FaTags, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';
import './PastPosts.scss';

const PastPosts = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past'

  useEffect(() => {
    fetchUserPosts();
  }, []);

  const fetchUserPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/posts/my-posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await axios.delete(`/posts/${postId}`);
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const getFilteredPosts = () => {
    const now = new Date();
    
    switch (filter) {
      case 'upcoming':
        return posts.filter(post => new Date(post.event_time) > now);
      case 'past':
        return posts.filter(post => new Date(post.event_time) <= now);
      default:
        return posts;
    }
  };

  const getPostStatus = (eventTime) => {
    const now = new Date();
    const eventDate = new Date(eventTime);
    
    if (eventDate > now) {
      return { status: 'upcoming', label: 'Upcoming', className: 'upcoming' };
    } else {
      return { status: 'past', label: 'Past Event', className: 'past' };
    }
  };

  const filteredPosts = getFilteredPosts();

  if (loading) {
    return (
      <div className="past-posts">
        <div className="past-posts__loading">
          <div className="loader"></div>
          <p>Loading your posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="past-posts">
      <div className="past-posts__header">
        <div className="past-posts__title-section">
          <h1 className="past-posts__title">My Posts</h1>
          <p className="past-posts__subtitle">Manage all your sports activities</p>
        </div>
        <Link to="/create-post" className="past-posts__create-btn">
          <FaPlus />
          Create New Post
        </Link>
      </div>

      <div className="past-posts__filters">
        <button
          className={`past-posts__filter ${filter === 'all' ? 'past-posts__filter--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Posts ({posts.length})
        </button>
        <button
          className={`past-posts__filter ${filter === 'upcoming' ? 'past-posts__filter--active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming ({posts.filter(post => new Date(post.event_time) > new Date()).length})
        </button>
        <button
          className={`past-posts__filter ${filter === 'past' ? 'past-posts__filter--active' : ''}`}
          onClick={() => setFilter('past')}
        >
          Past Events ({posts.filter(post => new Date(post.event_time) <= new Date()).length})
        </button>
      </div>

      <div className="past-posts__content">
        {filteredPosts.length === 0 ? (
          <div className="past-posts__empty">
            <h3>
              {filter === 'all' 
                ? "You haven't created any posts yet" 
                : filter === 'upcoming'
                ? "No upcoming events"
                : "No past events"
              }
            </h3>
            <p>
              {filter === 'all' 
                ? "Start by creating your first sports activity post!"
                : filter === 'upcoming'
                ? "Create a new post to organize upcoming sports activities."
                : "Your completed events will appear here."
              }
            </p>
            {filter !== 'past' && (
              <Link to="/create-post" className="past-posts__empty-cta">
                <FaPlus />
                Create Your First Post
              </Link>
            )}
          </div>
        ) : (
          <div className="past-posts__grid">
            {filteredPosts.map((post) => {
              const postStatus = getPostStatus(post.event_time);
              
              return (
                <div key={post.id} className="past-posts__card">
                  <div className="past-posts__card-header">
                    <div className="past-posts__sport-badge">
                      {post.sport}
                    </div>
                    <div className={`past-posts__status past-posts__status--${postStatus.className}`}>
                      {postStatus.label}
                    </div>
                  </div>

                  <div className="past-posts__card-content">
                    <h3 className="past-posts__card-title">{post.heading}</h3>
                    <p className="past-posts__card-description">{post.description}</p>

                    {post.tags && post.tags.length > 0 && (
                      <div className="past-posts__tags">
                        <FaTags className="past-posts__tags-icon" />
                        {post.tags.map((tag, index) => (
                          <span key={index} className="past-posts__tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="past-posts__card-details">
                    <div className="past-posts__detail">
                      <FaMapMarkerAlt className="past-posts__detail-icon" />
                      <span>{post.location_name}</span>
                    </div>

                    <div className="past-posts__detail">
                      <FaCalendarAlt className="past-posts__detail-icon" />
                      <span>{formatDateTime(post.event_time)}</span>
                    </div>

                    <div className="past-posts__detail">
                      <FaUsers className="past-posts__detail-icon" />
                      <span>{post.players_needed} players needed</span>
                    </div>
                  </div>

                  <div className="past-posts__card-footer">
                    <div className="past-posts__stats">
                      <div className="past-posts__stat">
                        <FaHeart className="past-posts__stat-icon" />
                        <span>{(post.interested_users || []).length} interested</span>
                      </div>
                      <div className="past-posts__created">
                        Created {formatRelativeTime(post.created_at)}
                      </div>
                    </div>

                    <div className="past-posts__actions">
                      {postStatus.status === 'upcoming' && (
                        <button
                          className="past-posts__action-btn past-posts__action-btn--edit"
                          title="Edit Post"
                        >
                          <FaEdit />
                        </button>
                      )}
                      <button
                        className="past-posts__action-btn past-posts__action-btn--delete"
                        onClick={() => handleDeletePost(post.id)}
                        title="Delete Post"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PastPosts;