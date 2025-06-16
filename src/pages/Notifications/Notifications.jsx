import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaUser, FaHeart, FaMapMarkerAlt, FaComment, FaCog } from 'react-icons/fa';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { formatRelativeTime } from '../../utils/dateUtils';
import './Notifications.scss';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'follow', 'interest', 'nearby_post', 'message'
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
      };

      socket.on('notification', handleNotification);

      return () => {
        socket.off('notification', handleNotification);
      };
    }
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/notifications?limit=50');
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds) => {
    try {
      await axios.post('/notifications/mark-read', { notificationIds });
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (markingAllRead) return;
    
    try {
      setMarkingAllRead(true);
      await axios.post('/notifications/mark-all-read');
      
      // Update all notifications to be marked as read
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      // You might want to show a toast notification here
      alert('Failed to mark all notifications as read. Please try again.');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.is_read);
      case 'follow':
      case 'interest':
      case 'nearby_post':
      case 'message':
        return notifications.filter(n => n.type === filter);
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'follow':
        return <FaUser className="notifications__icon notifications__icon--follow" />;
      case 'interest':
        return <FaHeart className="notifications__icon notifications__icon--interest" />;
      case 'nearby_post':
        return <FaMapMarkerAlt className="notifications__icon notifications__icon--nearby" />;
      case 'message':
        return <FaComment className="notifications__icon notifications__icon--message" />;
      default:
        return <FaBell className="notifications__icon" />;
    }
  };

  const getNotificationLink = (notification) => {
    const { type, data } = notification;
    
    switch (type) {
      case 'follow':
        return `/profile/${data.follower_id}`;
      case 'interest':
        return `/past-posts`;
      case 'nearby_post':
        return `/`;
      case 'message':
        return `/messages`;
      default:
        return '#';
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="notifications">
        <div className="notifications__loading">
          <div className="loader"></div>
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications">
      <div className="notifications__header">
        <div className="notifications__title-section">
          <h1 className="notifications__title">Notifications</h1>
          <p className="notifications__subtitle">Stay updated with your sports community</p>
        </div>
        <div className="notifications__actions">
          {unreadCount > 0 && (
            <button
              className="notifications__mark-all"
              onClick={markAllAsRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? 'Marking all read...' : `Mark all read (${unreadCount})`}
            </button>
          )}
          <Link to="/notifications/settings" className="notifications__settings">
            <FaCog />
            Settings
          </Link>
        </div>
      </div>

      <div className="notifications__filters">
        <button
          className={`notifications__filter ${filter === 'all' ? 'notifications__filter--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({notifications.length})
        </button>
        <button
          className={`notifications__filter ${filter === 'unread' ? 'notifications__filter--active' : ''}`}
          onClick={() => setFilter('unread')}
        >
          Unread ({unreadCount})
        </button>
        <button
          className={`notifications__filter ${filter === 'follow' ? 'notifications__filter--active' : ''}`}
          onClick={() => setFilter('follow')}
        >
          Follows ({notifications.filter(n => n.type === 'follow').length})
        </button>
        <button
          className={`notifications__filter ${filter === 'interest' ? 'notifications__filter--active' : ''}`}
          onClick={() => setFilter('interest')}
        >
          Interests ({notifications.filter(n => n.type === 'interest').length})
        </button>
        <button
          className={`notifications__filter ${filter === 'nearby_post' ? 'notifications__filter--active' : ''}`}
          onClick={() => setFilter('nearby_post')}
        >
          Nearby ({notifications.filter(n => n.type === 'nearby_post').length})
        </button>
        <button
          className={`notifications__filter ${filter === 'message' ? 'notifications__filter--active' : ''}`}
          onClick={() => setFilter('message')}
        >
          Messages ({notifications.filter(n => n.type === 'message').length})
        </button>
      </div>

      <div className="notifications__content">
        {filteredNotifications.length === 0 ? (
          <div className="notifications__empty">
            <FaBell className="notifications__empty-icon" />
            <h3>No notifications</h3>
            <p>
              {filter === 'all' 
                ? "You don't have any notifications yet. Start engaging with the community!"
                : `No ${filter === 'unread' ? 'unread' : filter} notifications.`
              }
            </p>
          </div>
        ) : (
          <div className="notifications__list">
            {filteredNotifications.map((notification) => (
              <Link
                key={notification.id}
                to={getNotificationLink(notification)}
                className={`notifications__item ${
                  !notification.is_read ? 'notifications__item--unread' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {getNotificationIcon(notification.type)}
                <div className="notifications__item-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className="notifications__time">
                    {formatRelativeTime(notification.created_at)}
                  </span>
                </div>
                {!notification.is_read && (
                  <div className="notifications__unread-dot"></div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;