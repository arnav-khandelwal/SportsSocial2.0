import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaUser, 
  FaUsers, 
  FaEdit, 
  FaMapMarkerAlt, 
  FaTags, 
  FaUserPlus, 
  FaUserCheck, 
  FaComment, 
  FaCalendarAlt, 
  FaClock, 
  FaHeart,
  FaPhone,
  FaHome,
  FaSave,
  FaTimes,
  FaCamera,
  FaCog
} from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate as useNav } from 'react-router-dom';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';
import FollowersModal from '../../components/FollowersModal/FollowersModal';
import './Profile.scss';

const Profile = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [skills, setSkills] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState('followers');
  const [editingField, setEditingField] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [saveLoading, setSaveLoading] = useState(false);

  const sportOptions = [
    'Football', 'Basketball', 'Tennis', 'Soccer', 'Baseball', 
    'Volleyball', 'Swimming', 'Running', 'Cycling', 'Golf',
    'Hockey', 'Cricket', 'Rugby', 'Badminton', 'Table Tennis'
  ];

  const skillLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  useEffect(() => {
    const profileId = userId || currentUser?.id;
    setIsOwnProfile(!userId || userId === currentUser?.id);
    
    if (profileId) {
      fetchProfile(profileId);
      fetchUserPosts(profileId);
      if (!userId || userId === currentUser?.id) {
        fetchSettings();
        fetchSkills();
      }
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

  const fetchSettings = async () => {
    try {
      const response = await axios.get('/settings');
      setSettings(response.data || {});
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await axios.get('/settings/skills');
      setSkills(response.data || []);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
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

  const handleFollowersClick = () => {
    setFollowersModalTab('followers');
    setShowFollowersModal(true);
  };

  const handleFollowingClick = () => {
    setFollowersModalTab('following');
    setShowFollowersModal(true);
  };

  const startEditing = (field, currentValue) => {
    setEditingField(field);
    setEditValues({ [field]: currentValue || '' });
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValues({});
  };

  const saveField = async (field) => {
    setSaveLoading(true);
    try {
      if (field === 'bio') {
        // Update user bio directly
        await axios.put('/settings', { bio: editValues[field] });
        setProfile(prev => ({ ...prev, bio: editValues[field] }));
      } else if (field === 'skills') {
        await axios.put('/settings/skills', { skills: editValues[field] });
        setSkills(editValues[field]);
      } else {
        // Update settings
        await axios.put('/settings', { [field]: editValues[field] });
        setSettings(prev => ({ ...prev, [field]: editValues[field] }));
      }
      
      setEditingField(null);
      setEditValues({});
    } catch (error) {
      console.error('Failed to save field:', error);
      alert('Failed to save changes');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleImageUpload = async (type) => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file size (max 5MB for profile, 10MB for cover)
      const maxSize = type === 'profile_picture' ? 5 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File size too large. Maximum ${type === 'profile_picture' ? '5MB' : '10MB'} allowed.`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }

      try {
        setSaveLoading(true);
        
        // Create a FormData object to send the file
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        // In a real implementation, you would upload to a file storage service
        // For now, we'll create a local URL and simulate the upload
        const imageUrl = URL.createObjectURL(file);
        
        // Update settings with the new image URL
        const updateField = type === 'profile_picture' ? 'profile_picture_url' : 'cover_photo_url';
        await axios.put('/settings', { [updateField]: imageUrl });
        
        setSettings(prev => ({ ...prev, [updateField]: imageUrl }));
        
        alert(`${type === 'profile_picture' ? 'Profile picture' : 'Cover photo'} updated successfully!`);
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setSaveLoading(false);
      }
    };

    // Trigger the file picker
    input.click();
  };

  const addSkill = () => {
    const currentSkills = editValues.skills || skills;
    setEditValues({
      ...editValues,
      skills: [...currentSkills, { sport: '', skill_level: 'beginner' }]
    });
  };

  const updateSkill = (index, field, value) => {
    const currentSkills = [...(editValues.skills || skills)];
    currentSkills[index][field] = value;
    setEditValues({
      ...editValues,
      skills: currentSkills
    });
  };

  const removeSkill = (index) => {
    const currentSkills = [...(editValues.skills || skills)];
    currentSkills.splice(index, 1);
    setEditValues({
      ...editValues,
      skills: currentSkills
    });
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

  const renderEditableField = (field, label, value, type = 'text', options = null) => {
    const isEditing = editingField === field;
    const displayValue = value || 'Not set';

    return (
      <div className="profile__editable-field">
        <div className="profile__field-header">
          <label className="profile__field-label">{label}</label>
          {!isEditing && (
            <button
              className="profile__edit-btn profile__edit-btn--small"
              onClick={() => startEditing(field, value)}
            >
              <FaEdit />
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="profile__field-edit">
            {type === 'textarea' ? (
              <textarea
                value={editValues[field] || ''}
                onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                rows="4"
                className="profile__field-input"
              />
            ) : type === 'select' ? (
              <select
                value={editValues[field] || ''}
                onChange={(e) => setEditValues({ ...editValues, [field]: parseInt(e.target.value) })}
                className="profile__field-input"
              >
                {options.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={type}
                value={editValues[field] || ''}
                onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                className="profile__field-input"
              />
            )}
            
            <div className="profile__field-actions">
              <button
                className="profile__save-btn"
                onClick={() => saveField(field)}
                disabled={saveLoading}
              >
                <FaSave />
                {saveLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                className="profile__cancel-btn"
                onClick={cancelEditing}
              >
                <FaTimes />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="profile__field-value">
            {displayValue}
          </div>
        )}
      </div>
    );
  };

  const renderSkillsEdit = () => {
    const isEditing = editingField === 'skills';
    const currentSkills = isEditing ? (editValues.skills || skills) : skills;

    return (
      <div className="profile__editable-field">
        <div className="profile__field-header">
          <label className="profile__field-label">Sports & Skills</label>
          {!isEditing && (
            <button
              className="profile__edit-btn profile__edit-btn--small"
              onClick={() => startEditing('skills', skills)}
            >
              <FaEdit />
            </button>
          )}
        </div>
        
        {isEditing ? (
          <div className="profile__field-edit">
            <div className="profile__skills-edit">
              {currentSkills.map((skill, index) => (
                <div key={index} className="profile__skill-edit-item">
                  <select
                    value={skill.sport}
                    onChange={(e) => updateSkill(index, 'sport', e.target.value)}
                    className="profile__skill-select"
                  >
                    <option value="">Select Sport</option>
                    {sportOptions.map(sport => (
                      <option key={sport} value={sport}>{sport}</option>
                    ))}
                  </select>
                  
                  <select
                    value={skill.skill_level}
                    onChange={(e) => updateSkill(index, 'skill_level', e.target.value)}
                    className="profile__skill-select"
                  >
                    {skillLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    className="profile__remove-skill-btn"
                    onClick={() => removeSkill(index)}
                  >
                    <FaTimes />
                  </button>
                </div>
              ))}
              
              <button
                className="profile__add-skill-btn"
                onClick={addSkill}
              >
                Add Sport
              </button>
            </div>
            
            <div className="profile__field-actions">
              <button
                className="profile__save-btn"
                onClick={() => saveField('skills')}
                disabled={saveLoading}
              >
                <FaSave />
                {saveLoading ? 'Saving...' : 'Save Skills'}
              </button>
              <button
                className="profile__cancel-btn"
                onClick={cancelEditing}
              >
                <FaTimes />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="profile__skills-display">
            {currentSkills.length === 0 ? (
              <p className="profile__no-skills">No skills added yet</p>
            ) : (
              currentSkills.map((skill, index) => (
                <div key={index} className="profile__skill-item">
                  <span className="profile__skill-sport">{skill.sport}</span>
                  <span className="profile__skill-level">{skill.skill_level}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
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
      {/* Cover Photo Banner */}
      <div className="profile__banner">
        {settings?.cover_photo_url ? (
          <img src={settings.cover_photo_url} alt="Cover" className="profile__banner-image" />
        ) : (
          <div className="profile__banner-placeholder">
            <div className="profile__banner-text">
              <h2>{profile.username}'s Profile</h2>
              <p>Sports enthusiast and community member</p>
            </div>
          </div>
        )}
        {isOwnProfile && (
          <button 
            className="profile__banner-edit"
            onClick={() => handleImageUpload('cover_photo')}
            disabled={saveLoading}
          >
            <FaCamera />
            {saveLoading ? 'Uploading...' : 'Change Cover'}
          </button>
        )}
      </div>

      <div className="profile__header">
        <div className="profile__avatar">
          {settings?.profile_picture_url ? (
            <img src={settings.profile_picture_url} alt="Profile" />
          ) : (
            <FaUser />
          )}
          {isOwnProfile && (
            <button 
              className="profile__avatar-edit"
              onClick={() => handleImageUpload('profile_picture')}
              disabled={saveLoading}
            >
              <FaCamera />
            </button>
          )}
        </div>
        
        <div className="profile__info">
          <h1 className="profile__name">{profile.username}</h1>
          
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
            <button 
              className="profile__edit-btn"
              onClick={() => navigate('/settings')}
            >
              <FaCog />
              Settings
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
        {/* About Me Section */}
        <div className="profile__section">
          <h3 className="profile__section-title">About Me</h3>
          {isOwnProfile ? (
            renderEditableField('bio', 'Bio', profile.bio || settings?.bio, 'textarea')
          ) : (
            <p className="profile__bio">{profile.bio || 'No bio available'}</p>
          )}
        </div>

        {/* Contact Information */}
        {isOwnProfile && (
          <div className="profile__section">
            <h3 className="profile__section-title">Contact Information</h3>
            <div className="profile__contact-grid">
              {renderEditableField('phone_number', 'Phone Number', settings?.phone_number, 'tel')}
              {renderEditableField('location_city', 'Home City', settings?.location_city)}
            </div>
          </div>
        )}

        {/* Display contact info for own profile (read-only for others) */}
        {!isOwnProfile && (settings?.phone_number || settings?.location_city) && (
          <div className="profile__section">
            <h3 className="profile__section-title">Contact Information</h3>
            <div className="profile__contact-display">
              {settings?.phone_number && (
                <div className="profile__contact-item">
                  <FaPhone />
                  <span>{settings.phone_number}</span>
                </div>
              )}
              {settings?.location_city && (
                <div className="profile__contact-item">
                  <FaHome />
                  <span>{settings.location_city}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sports & Skills */}
        <div className="profile__section">
          <h3 className="profile__section-title">
            <FaTags />
            Sports & Skills
          </h3>
          {isOwnProfile ? (
            renderSkillsEdit()
          ) : (
            <div className="profile__skills-display">
              {profile.sports && profile.sports.length > 0 ? (
                profile.sports.map((sport, index) => (
                  <span key={index} className="profile__sport">
                    {sport}
                  </span>
                ))
              ) : (
                <p>No sports listed</p>
              )}
            </div>
          )}
        </div>

        {/* Interests/Tags */}
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

        {/* My Posts Section */}
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