import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaUser, FaUsers, FaEdit, FaMapMarkerAlt, FaTags, FaUserPlus, FaUserCheck, FaComment, FaCalendarAlt, FaClock, FaHeart, FaStar, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';
import FollowersModal from '../../components/FollowersModal/FollowersModal';
import './Profile.scss';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState('followers');
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [postsExpanded, setPostsExpanded] = useState(false);

  useEffect(() => {
    const profileId = userId || currentUser?.id;
    setIsOwnProfile(!userId || userId === currentUser?.id);
    
    if (profileId) {
      fetchProfile(profileId);
      fetchUserPosts(profileId);
      fetchUserReviews(profileId);
    }
  }, [userId, currentUser]);

  const fetchProfile = async (profileId) => {
    try {
      const response = await axios.get(`/users/${profileId}`);
      setProfile(response.data);
      
      // Check if current user is following this profile
      if (!isOwnProfile && response.data.followers && currentUser) {
        const isCurrentlyFollowing = response.data.followers.some(
          follower => follower.id === currentUser.id
        );
        setIsFollowing(isCurrentlyFollowing);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async (profileId) => {
    try {
      setPostsLoading(true);
      // If it's the current user's profile, use my-posts endpoint
      if (profileId === currentUser?.id) {
        const response = await axios.get('/posts/my-posts');
        setPosts(response.data);
      } else {
        // For other users, we'll need to fetch their posts differently
        // For now, we'll show empty since we don't have a public posts endpoint
        setPosts([]);
      }
    } catch (error) {
      console.error('Failed to fetch user posts:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  const fetchUserReviews = async (profileId) => {
    try {
      setReviewsLoading(true);
      // If it's the current user's profile, use my-reviews endpoint
      if (profileId === currentUser?.id) {
        const response = await axios.get('/reviews/my-reviews');
        setReviews(response.data);
      } else {
        // For other users, we can show their public reviews
        // We'll need to filter by author_id on the frontend since we don't have a specific endpoint
        const response = await axios.get('/reviews');
        const userReviews = response.data.filter(review => review.author_id === profileId);
        setReviews(userReviews);
      }
    } catch (error) {
      console.error('Failed to fetch user reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (followLoading) return;
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await axios.post(`/users/${profile.id}/unfollow`);
        setIsFollowing(false);
      } else {
        await axios.post(`/users/${profile.id}/follow`);
        setIsFollowing(true);
      }
      // Refresh profile to get updated follower count
      fetchProfile(profile.id);
    } catch (error) {
      console.error('Follow/unfollow error:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleMessage = async () => {
    // Navigate to messages page with this user's conversation
    navigate('/messages', { 
      state: { 
        startConversation: {
          id: profile.id,
          username: profile.username,
          type: 'direct'
        }
      }
    });
  };

  const handleFollowersClick = () => {
    setFollowersModalTab('followers');
    setShowFollowersModal(true);
  };

  const handleFollowingClick = () => {
    setFollowersModalTab('following');
    setShowFollowersModal(true);
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

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={index}
        className={`profile__review-star ${index < rating ? 'profile__review-star--filled' : ''}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="profile">
        <div className="profile__loading">
          <div className="loader"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile">
        <div className="profile__error">
          <h3>Profile not found</h3>
          <p>The user you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile__header">
        <div className="profile__avatar">
          <FaUser />
        </div>
        
        <div className="profile__info">
          <h1 className="profile__name">{profile.username}</h1>
          {profile.bio && (
            <p className="profile__bio">{profile.bio}</p>
          )}
          
          <div className="profile__stats">
            <button 
              className="profile__stat profile__stat--clickable"
              onClick={handleFollowersClick}
            >
              <FaUsers />
              <span>{profile.followers?.length || 0} Followers</span>
            </button>
            <button 
              className="profile__stat profile__stat--clickable"
              onClick={handleFollowingClick}
            >
              <FaUsers />
              <span>{profile.following?.length || 0} Following</span>
            </button>
          </div>
        </div>

        <div className="profile__actions">
          {isOwnProfile ? (
            <button className="profile__edit-btn">
              <FaEdit />
              Edit Profile
            </button>
          ) : (
            <div className="profile__user-actions">
              <button
                className={`profile__follow-btn ${isFollowing ? 'profile__follow-btn--following' : ''}`}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  'Loading...'
                ) : isFollowing ? (
                  <>
                    <FaUserCheck />
                    Following
                  </>
                ) : (
                  <>
                    <FaUserPlus />
                    Follow
                  </>
                )}
              </button>
              
              {isFollowing && (
                <button
                  className="profile__message-btn"
                  onClick={handleMessage}
                >
                  <FaComment />
                  Message
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="profile__content">
        {profile.sports && profile.sports.length > 0 && (
          <div className="profile__section">
            <h3 className="profile__section-title">
              <FaMapMarkerAlt />
              Sports
            </h3>
            <div className="profile__sports">
              {profile.sports.map((sport, index) => (
                <span key={index} className="profile__sport">
                  {sport}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.tags && profile.tags.length > 0 && (
          <div className="profile__section">
            <h3 className="profile__section-title">
              <FaTags />
              Interests
            </h3>
            <div className="profile__tags">
              {profile.tags.map((tag, index) => (
                <span key={index} className="profile__tag">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="profile__section">
          <button 
            className="profile__section-title profile__section-title--collapsible"
            onClick={() => setReviewsExpanded(!reviewsExpanded)}
          >
            <FaStar />
            Reviews ({reviews.length})
            {reviewsExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
          
          {reviewsExpanded && (
            <div className="profile__reviews">
              {reviewsLoading ? (
                <div className="profile__reviews-loading">
                  <div className="loader"></div>
                  <p>Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="profile__reviews-empty">
                  <p>
                    {isOwnProfile 
                      ? "You haven't written any reviews yet."
                      : `${profile.username} hasn't written any reviews yet.`
                    }
                  </p>
                  {isOwnProfile && (
                    <button 
                      className="profile__create-review-btn"
                      onClick={() => navigate('/create-review')}
                    >
                      Write Your First Review
                    </button>
                  )}
                </div>
              ) : (
                <div className="profile__reviews-list">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="profile__review">
                      <div className="profile__review-header">
                        <div className="profile__review-meta">
                          <span className="profile__review-category">{review.category}</span>
                          <div className="profile__review-rating">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <span className="profile__review-date">
                          {formatRelativeTime(review.created_at)}
                        </span>
                      </div>
                      
                      <h4 className="profile__review-title">{review.title}</h4>
                      <p className="profile__review-content">{review.content}</p>
                      
                      {review.tags && review.tags.length > 0 && (
                        <div className="profile__review-tags">
                          {review.tags.map((tag, index) => (
                            <span key={index} className="profile__review-tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {reviews.length > 3 && (
                    <div className="profile__view-all-reviews">
                      <button 
                        className="profile__view-all-reviews-btn"
                        onClick={() => navigate('/reviews')}
                      >
                        View All Reviews ({reviews.length})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Posts Section - Now Collapsible */}
        {isOwnProfile && (
          <div className="profile__section">
            <button 
              className="profile__section-title profile__section-title--collapsible"
              onClick={() => setPostsExpanded(!postsExpanded)}
            >
              <FaCalendarAlt />
              My Posts ({posts.length})
              {postsExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            
            {postsExpanded && (
              <div className="profile__posts">
                {postsLoading ? (
                  <div className="profile__posts-loading">
                    <div className="loader"></div>
                    <p>Loading posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="profile__empty">
                    <p>You haven't created any posts yet.</p>
                    <button 
                      className="profile__create-post-btn"
                      onClick={() => navigate('/create-post')}
                    >
                      Create Your First Post
                    </button>
                  </div>
                ) : (
                  <div className="profile__posts-list">
                    {posts.slice(0, 3).map((post) => {
                      const postStatus = getPostStatus(post.event_time);
                      return (
                        <div key={post.id} className="profile__post">
                          <div className="profile__post-header">
                            <h4>{post.heading}</h4>
                            <div className="profile__post-badges">
                              <span className="profile__post-sport">{post.sport}</span>
                              <span className={`profile__post-status profile__post-status--${postStatus.className}`}>
                                {postStatus.label}
                              </span>
                            </div>
                          </div>
                          <p className="profile__post-description">{post.description}</p>
                          
                          <div className="profile__post-details">
                            <div className="profile__post-detail">
                              <FaMapMarkerAlt />
                              <span>{post.location_name}</span>
                            </div>
                            <div className="profile__post-detail">
                              <FaCalendarAlt />
                              <span>{formatDateTime(post.event_time)}</span>
                            </div>
                            <div className="profile__post-detail">
                              <FaUsers />
                              <span>{post.players_needed} players needed</span>
                            </div>
                          </div>

                          <div className="profile__post-meta">
                            <div className="profile__post-interest">
                              <FaHeart />
                              <span>{(post.interested_users || []).length} interested</span>
                            </div>
                            <span className="profile__post-created">
                              Created {formatRelativeTime(post.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    
                    {posts.length > 3 && (
                      <div className="profile__view-all">
                        <button 
                          className="profile__view-all-btn"
                          onClick={() => navigate('/past-posts')}
                        >
                          View All Posts ({posts.length})
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={profile?.id}
        initialTab={followersModalTab}
      />
    </div>
  );
};

export default Profile;