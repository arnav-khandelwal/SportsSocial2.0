import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaUser, FaUserPlus, FaUserCheck, FaComment } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Search.scss';

const Search = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [currentUserFollowing, setCurrentUserFollowing] = useState(new Set());

  useEffect(() => {
    if (currentUser) {
      fetchCurrentUserFollowing();
    }
  }, [currentUser]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const fetchCurrentUserFollowing = async () => {
    try {
      const response = await axios.get(`/users/${currentUser.id}`);
      const followingIds = new Set(
        (response.data.following || []).map(user => user.id)
      );
      setCurrentUserFollowing(followingIds);
      setFollowedUsers(followingIds);
    } catch (error) {
      console.error('Failed to fetch current user following:', error);
    }
  };

  const searchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/users/search', {
        params: { q: searchQuery }
      });

      // Filter out the current user from search results
      const filteredUsers = response.data.filter(user => user.id !== currentUser?.id);

      // Fetch profile pictures for each user
      for (const user of filteredUsers) {
        if (!user.profile_picture_url) {
          try {
            const profileResponse = await axios.get(`/settings/public/${user.id}`);
            user.profile_picture_url = profileResponse.data.profile_picture_url;
          } catch (error) {
            console.error(`Failed to fetch profile for user ${user.id}:`, error);
          }
        }
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      await axios.post(`/users/${userId}/follow`);
      setFollowedUsers(prev => new Set([...prev, userId]));
      setCurrentUserFollowing(prev => new Set([...prev, userId]));
    } catch (error) {
      console.error('Follow error:', error);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      await axios.post(`/users/${userId}/unfollow`);
      setFollowedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      setCurrentUserFollowing(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    } catch (error) {
      console.error('Unfollow error:', error);
    }
  };

  const handleMessage = (user) => {
    navigate('/messages', {
      state: {
        startConversation: {
          id: user.id,
          username: user.username,
          type: 'direct'
        }
      }
    });
  };

  const isFollowing = (userId) => {
    return followedUsers.has(userId);
  };

  const canMessage = (user) => {
    // Can message if current user follows them or they follow current user
    return isFollowing(user.id);
  };

  return (
    <div className="search">
      <div className="search__header">
        <h1 className="search__title">Find People</h1>
        <p className="search__subtitle">Connect with other sports enthusiasts</p>
      </div>

      <div className="search__input-container">
        <FaSearch className="search__input-icon" />
        <input
          type="text"
          placeholder="Search by name, sport, or interests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search__input"
        />
      </div>

      {loading && (
        <div className="search__loading">
          <div className="loader"></div>
          <p>Searching...</p>
        </div>
      )}

      <div className="search__results">
        {users.map((user) => (
          <div key={user.id} className="search__user-card">
            <Link 
              to={`/profile/${user.id}`}
              className="search__user-avatar-link"
            >
              <div className="search__user-avatar">
                {user.profile_picture_url ? (
                  <img 
                    src={user.profile_picture_url} 
                    alt={`${user.username}'s profile`} 
                    className="search__user-avatar__image"
                  />
                ) : (
                  <FaUser />
                )}
              </div>
            </Link>
            
            <div className="search__user-info">
              <Link 
                to={`/profile/${user.id}`}
                className="search__user-name-link"
              >
                <h3 className="search__user-name">{user.username}</h3>
              </Link>
              {user.bio && (
                <p className="search__user-bio">{user.bio}</p>
              )}
              
              {user.sports && user.sports.length > 0 && (
                <div className="search__user-sports">
                  <strong>Sports:</strong> {user.sports.join(', ')}
                </div>
              )}
              
              {user.tags && user.tags.length > 0 && (
                <div className="search__user-tags">
                  {user.tags.map((tag, index) => (
                    <span key={index} className="search__tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="search__user-actions">
              {isFollowing(user.id) ? (
                <button
                  className="search__follow-btn search__follow-btn--following"
                  onClick={() => handleUnfollow(user.id)}
                >
                  <FaUserCheck />
                  Following
                </button>
              ) : (
                <button
                  className="search__follow-btn"
                  onClick={() => handleFollow(user.id)}
                >
                  <FaUserPlus />
                  Follow
                </button>
              )}
              
              {canMessage(user) && (
                <button
                  className="search__message-btn"
                  onClick={() => handleMessage(user)}
                >
                  <FaComment />
                  Message
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {searchQuery && users.length === 0 && !loading && (
        <div className="search__empty">
          <h3>No users found</h3>
          <p>Try searching with different keywords</p>
        </div>
      )}
    </div>
  );
};

export default Search;