import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaTimes, FaUser, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './FollowersModal.scss';

const FollowersModal = ({ isOpen, onClose, userId, initialTab = 'followers' }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState(new Set());

  useEffect(() => {
    if (isOpen && userId) {
      fetchFollowersAndFollowing();
    }
  }, [isOpen, userId]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchFollowersAndFollowing = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/users/${userId}`);
      const userData = response.data;
      
      setFollowers(userData.followers || []);
      setFollowing(userData.following || []);
      
      // Track which users the current user is following
      if (currentUser) {
        const currentUserFollowing = new Set();
        userData.followers?.forEach(follower => {
          if (follower.id !== currentUser.id) {
            // Check if current user follows this follower
            // This would need to be enhanced with actual follow status
            currentUserFollowing.add(follower.id);
          }
        });
        userData.following?.forEach(followedUser => {
          if (followedUser.id !== currentUser.id) {
            currentUserFollowing.add(followedUser.id);
          }
        });
        setFollowedUsers(currentUserFollowing);
      }
    } catch (error) {
      console.error('Failed to fetch followers/following:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (targetUserId) => {
    try {
      await axios.post(`/users/${targetUserId}/follow`);
      setFollowedUsers(prev => new Set([...prev, targetUserId]));
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const handleUnfollow = async (targetUserId) => {
    try {
      await axios.post(`/users/${targetUserId}/unfollow`);
      setFollowedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(targetUserId);
        return newSet;
      });
    } catch (error) {
      console.error('Unfollow error:', error);
    }
  };

  const renderUserList = (users) => {
    if (loading) {
      return (
        <div className="followers-modal__loading">
          <div className="loader"></div>
          <p>Loading...</p>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <div className="followers-modal__empty">
          <FaUser className="followers-modal__empty-icon" />
          <p>
            {activeTab === 'followers' 
              ? 'No followers yet' 
              : 'Not following anyone yet'
            }
          </p>
        </div>
      );
    }

    return (
      <div className="followers-modal__user-list">
        {users.map((user) => (
          <div key={user.id} className="followers-modal__user-item">
            <Link 
              to={`/profile/${user.id}`}
              className="followers-modal__user-avatar-link"
              onClick={onClose}
            >
              <div className="followers-modal__user-avatar">
                <FaUser />
              </div>
            </Link>
            
            <div className="followers-modal__user-info">
              <Link 
                to={`/profile/${user.id}`}
                className="followers-modal__user-name-link"
                onClick={onClose}
              >
                <h4 className="followers-modal__user-name">{user.username}</h4>
              </Link>
              {user.bio && (
                <p className="followers-modal__user-bio">{user.bio}</p>
              )}
            </div>

            {currentUser && user.id !== currentUser.id && (
              <div className="followers-modal__user-actions">
                {followedUsers.has(user.id) ? (
                  <button
                    className="followers-modal__follow-btn followers-modal__follow-btn--following"
                    onClick={() => handleUnfollow(user.id)}
                  >
                    <FaUserCheck />
                    Following
                  </button>
                ) : (
                  <button
                    className="followers-modal__follow-btn"
                    onClick={() => handleFollow(user.id)}
                  >
                    <FaUserPlus />
                    Follow
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="followers-modal">
      <div className="followers-modal__overlay" onClick={onClose} />
      <div className="followers-modal__content">
        <div className="followers-modal__header">
          <div className="followers-modal__tabs">
            <button
              className={`followers-modal__tab ${activeTab === 'followers' ? 'followers-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('followers')}
            >
              Followers ({followers.length})
            </button>
            <button
              className={`followers-modal__tab ${activeTab === 'following' ? 'followers-modal__tab--active' : ''}`}
              onClick={() => setActiveTab('following')}
            >
              Following ({following.length})
            </button>
          </div>
          <button className="followers-modal__close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="followers-modal__body">
          {activeTab === 'followers' 
            ? renderUserList(followers)
            : renderUserList(following)
          }
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;