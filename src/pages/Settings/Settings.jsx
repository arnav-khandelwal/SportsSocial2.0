import { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaLock, 
  FaBell, 
  FaEye, 
  FaShieldAlt, 
  FaCog,
  FaCamera,
  FaMapMarkerAlt,
  FaTags,
  FaClock,
  FaSave,
  FaEdit,
  FaTrash,
  FaTimes
} from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './Settings.scss';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('security');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [skills, setSkills] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'security', label: 'Security', icon: FaLock },
    // { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'privacy', label: 'Privacy', icon: FaEye },
    { id: 'content', label: 'Content', icon: FaShieldAlt }
  ];

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

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  useEffect(() => {
    fetchSettings();
    fetchSkills();
    fetchAvailability();
  }, []);

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

  const fetchAvailability = async () => {
    try {
      const response = await axios.get('/settings/availability');
      setAvailability(response.data || []);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      setLoading(true);
      await axios.put('/settings', newSettings);
      setSettings(prev => ({ ...prev, ...newSettings }));
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSkills = async (newSkills) => {
    try {
      setLoading(true);
      await axios.put('/settings/skills', { skills: newSkills });
      setSkills(newSkills);
    } catch (error) {
      console.error('Failed to update skills:', error);
      alert('Failed to update skills');
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (newAvailability) => {
    try {
      setLoading(true);
      await axios.put('/settings/availability', { availability: newAvailability });
      setAvailability(newAvailability);
    } catch (error) {
      console.error('Failed to update availability:', error);
      alert('Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await axios.post('/settings/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    setSkills([...skills, { sport: '', skill_level: 'beginner' }]);
  };

  const updateSkill = (index, field, value) => {
    const newSkills = [...skills];
    newSkills[index][field] = value;
    setSkills(newSkills);
  };

  const removeSkill = (index) => {
    const newSkills = skills.filter((_, i) => i !== index);
    setSkills(newSkills);
  };

  const addAvailabilitySlot = () => {
    setAvailability([...availability, {
      day_of_week: 0,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true
    }]);
  };

  const updateAvailabilitySlot = (index, field, value) => {
    const newAvailability = [...availability];
    newAvailability[index][field] = value;
    setAvailability(newAvailability);
  };

  const removeAvailabilitySlot = (index) => {
    const newAvailability = availability.filter((_, i) => i !== index);
    setAvailability(newAvailability);
  };

  const renderSecurityTab = () => (
    <div className="settings__tab-content">
      <div className="settings__section">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordChange} className="settings__password-form">
          <div className="settings__form-group">
            <label>Current Password</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
              required
            />
          </div>
          
          <div className="settings__form-group">
            <label>New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              required
              minLength="6"
            />
          </div>
          
          <div className="settings__form-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
              minLength="6"
            />
          </div>
          
          <button
            type="submit"
            className="settings__btn settings__btn--primary"
            disabled={loading}
          >
            Change Password
          </button>
        </form>
      </div>
    </div>
  );

  // const renderNotificationsTab = () => (
  //   <div className="settings__tab-content">
  //     <div className="settings__section">
  //       <h3>Push Notifications</h3>
  //       <div className="settings__toggle-group">
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.push_enabled || false}
  //             onChange={(e) => updateSettings({ push_enabled: e.target.checked })}
  //           />
  //           <span>Enable Push Notifications</span>
  //         </label>
          
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.push_messages || false}
  //             onChange={(e) => updateSettings({ push_messages: e.target.checked })}
  //           />
  //           <span>New Messages</span>
  //         </label>
          
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.push_interactions || false}
  //             onChange={(e) => updateSettings({ push_interactions: e.target.checked })}
  //           />
  //           <span>Post Interactions</span>
  //         </label>
          
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.push_reminders || false}
  //             onChange={(e) => updateSettings({ push_reminders: e.target.checked })}
  //           />
  //           <span>Event Reminders</span>
  //         </label>
          
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.push_friend_activity || false}
  //             onChange={(e) => updateSettings({ push_friend_activity: e.target.checked })}
  //           />
  //           <span>Friend Activity</span>
  //         </label>
          
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.push_location_based || false}
  //             onChange={(e) => updateSettings({ push_location_based: e.target.checked })}
  //           />
  //           <span>Location-Based Activities</span>
  //         </label>
          
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.push_mentions || false}
  //             onChange={(e) => updateSettings({ push_mentions: e.target.checked })}
  //           />
  //           <span>Group Chat Mentions</span>
  //         </label>
  //       </div>
  //     </div>

  //     <div className="settings__section">
  //       <h3>In-App Notifications</h3>
  //       <div className="settings__toggle-group">
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.notifications_new_messages || false}
  //             onChange={(e) => updateSettings({ notifications_new_messages: e.target.checked })}
  //           />
  //           <span>New Messages</span>
  //         </label>
          
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.notifications_post_interactions || false}
  //             onChange={(e) => updateSettings({ notifications_post_interactions: e.target.checked })}
  //           />
  //           <span>Post Interactions</span>
  //         </label>
          
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.notifications_event_reminders || false}
  //             onChange={(e) => updateSettings({ notifications_event_reminders: e.target.checked })}
  //           />
  //           <span>Event Reminders</span>
  //         </label>
          
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.notifications_friend_activity || false}
  //             onChange={(e) => updateSettings({ notifications_friend_activity: e.target.checked })}
  //           />
  //           <span>Friend Activity</span>
  //         </label>
          
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.notifications_location_based || false}
  //             onChange={(e) => updateSettings({ notifications_location_based: e.target.checked })}
  //           />
  //           <span>Location-Based Activities</span>
  //         </label>
          
  //         <label className="settings__toggle">
  //           <input
  //             type="checkbox"
  //             checked={settings?.notifications_group_mentions || false}
  //             onChange={(e) => updateSettings({ notifications_group_mentions: e.target.checked })}
  //           />
  //           <span>Group Chat Mentions</span>
  //         </label>
  //       </div>
  //     </div>
  //   </div>
  // );

  const renderPrivacyTab = () => (
    <div className="settings__tab-content">
      <div className="settings__section">
        <h3>Profile Visibility</h3>
        <div className="settings__form-group">
          <label>Who can see your profile?</label>
          <select
            value={settings?.profile_visibility || 'public'}
            onChange={(e) => updateSettings({ profile_visibility: e.target.value })}
          >
            <option value="public">Everyone</option>
            <option value="friends_only">Friends Only</option>
          </select>
        </div>
        
        <div className="settings__form-group">
          <label>Location Sharing</label>
          <select
            value={settings?.location_sharing || 'general'}
            onChange={(e) => updateSettings({ location_sharing: e.target.value })}
          >
            <option value="exact">Exact Location</option>
            <option value="general">General Area</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        
        <label className="settings__toggle">
          <input
            type="checkbox"
            checked={settings?.show_online_status || false}
            onChange={(e) => updateSettings({ show_online_status: e.target.checked })}
          />
          <span>Show Online Status</span>
        </label>
        
        <div className="settings__form-group">
          <label>Activity History Visibility</label>
          <select
            value={settings?.activity_history_visibility || 'public'}
            onChange={(e) => updateSettings({ activity_history_visibility: e.target.value })}
          >
            <option value="public">Public</option>
            <option value="friends_only">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>
        
        <div className="settings__form-group">
          <label>Phone Number Visibility</label>
          <select
            value={settings?.phone_visibility || 'friends_only'}
            onChange={(e) => updateSettings({ phone_visibility: e.target.value })}
          >
            <option value="public">Public</option>
            <option value="friends_only">Friends Only</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderContentTab = () => (
    <div className="settings__tab-content">
      <div className="settings__section">
        <h3>Message Controls</h3>
        <div className="settings__form-group">
          <label>Who can send you messages?</label>
          <select
            value={settings?.message_requests || 'anyone'}
            onChange={(e) => updateSettings({ message_requests: e.target.value })}
          >
            <option value="anyone">Anyone</option>
            <option value="friends_only">Friends Only</option>
            <option value="none">No One</option>
          </select>
        </div>
        
        <div className="settings__form-group">
          <label>Who can comment on your posts?</label>
          <select
            value={settings?.post_comments || 'anyone'}
            onChange={(e) => updateSettings({ post_comments: e.target.value })}
          >
            <option value="anyone">Anyone</option>
            <option value="friends_only">Friends Only</option>
            <option value="none">No One</option>
          </select>
        </div>
        
        <div className="settings__form-group">
          <label>Event Invitations</label>
          <select
            value={settings?.event_invitations || 'manual'}
            onChange={(e) => updateSettings({ event_invitations: e.target.value })}
          >
            <option value="auto_accept">Auto Accept</option>
            <option value="manual">Manual Approval</option>
            <option value="block">Block All</option>
          </select>
        </div>
      </div>
    </div>
  );

  if (!settings) {
    return (
      <div className="settings">
        <div className="settings__loading">
          <div className="loader"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings">
      <div className="settings__header">
        <h1>Settings</h1>
        <p>Manage your account preferences and privacy</p>
      </div>

      <div className="settings__container">
        <div className="settings__sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`settings__tab ${activeTab === tab.id ? 'settings__tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="settings__content">
          {activeTab === 'security' && renderSecurityTab()}
          {/* {activeTab === 'notifications' && renderNotificationsTab()} */}
          {activeTab === 'privacy' && renderPrivacyTab()}
          {activeTab === 'content' && renderContentTab()}
        </div>
      </div>
    </div>
  );
};

export default Settings;