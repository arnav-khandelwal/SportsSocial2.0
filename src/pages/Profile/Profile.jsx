import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaUser, FaUsers, FaEdit, FaMapMarkerAlt, FaTags, FaUserPlus, FaUserCheck, FaComment, FaCalendarAlt, FaClock, FaHeart } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';
import './Profile.scss';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const profileId = userId || currentUser?.id;
    setIsOwnProfile(!userId || userId === currentUser?.id);
    
    if (profileId) {
      fetchProfile(profileId);
      fetchUserPosts(profileId);
    }
  }, [userId, currentUser]);

  const fetchProfile = async (profileId) => {
    try {
      const response = await axios.get(`/users/${profileId}`);
      setProfile(response.data);
      
      // Check if current user is following this profile
      if (!isOwnProfile && response.data.followers) {
        const isCurrentlyFollowing = response.data.followers.some(
          follower => follower.id === currentUser?.id
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
    // Navigate to messages page and start a conversation with this user
    navigate('/messages');
    // Note: In a real implementation, you might want to automatically select this user's conversation
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
            <div className="profile__stat">
              <FaUsers />
              <span>{profile.followers?.length || 0} Followers</span>
            </div>
            <div className="profile__stat">
              <FaUsers />
              <span>{profile.following?.length || 0} Following</span>
            </div>
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
              <button
                className="profile__message-btn"
                onClick={handleMessage}
              >
                <FaComment />
                Message
              </button>
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

        {isOwnProfile && (
          <div className="profile__section">
            <h3 className="profile__section-title">My Posts</h3>
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
              <div className="profile__posts">
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
    </div>
  );
};

export default Profile;