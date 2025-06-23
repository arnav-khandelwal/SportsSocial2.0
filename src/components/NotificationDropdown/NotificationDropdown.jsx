import { useState, useEffect, useRef } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { formatRelativeTime } from '../../utils/dateUtils';
import './NotificationDropdown.scss';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenId, setLastSeenId] = useState(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    
    // Load last seen notification ID from localStorage
    const savedLastSeenId = localStorage.getItem('lastSeenNotificationId');
    if (savedLastSeenId) {
      setLastSeenId(savedLastSeenId);
    }
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNotification = (notification) => {
        // Only add new notifications that haven't been seen before
        if (!lastSeenId || notification.id > lastSeenId) {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
          setLastSeenId(notification.id);
          localStorage.setItem('lastSeenNotificationId', notification.id);
        }
      };

      socket.on('notification', handleNotification);

      return () => {
        socket.off('notification', handleNotification);
      };
    }
  }, [socket, lastSeenId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/notifications?limit=50');
      const uniqueNotifications = Array.from(
        new Map(response.data.map(item => [item.id, item])).values()
      );
      setNotifications(uniqueNotifications);
      
      // Update last seen ID if we have new notifications
      if (uniqueNotifications.length > 0) {
        const latestId = uniqueNotifications[0].id;
        setLastSeenId(latestId);
        localStorage.setItem('lastSeenNotificationId', latestId);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
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
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      
      // Remove read notifications from view
      setNotifications(prev => 
        prev.filter(notif => !notificationIds.includes(notif.id))
      );
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post('/notifications/mark-all-read');
      setNotifications([]);
      setUnreadCount(0);
      
      // Update last seen ID to prevent duplicates
      if (notifications.length > 0) {
        const latestId = notifications[0].id;
        setLastSeenId(latestId);
        localStorage.setItem('lastSeenNotificationId', latestId);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }
    setIsOpen(false);
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

  const formatNotificationMessage = (notification) => {
    const timeAgo = formatRelativeTime(notification.created_at);
    
    // Add the time to the message
    return `${notification.message} (${timeAgo})`;
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button
        className="notification-dropdown__trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-dropdown__badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown__menu">
          <div className="notification-dropdown__header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button
                className="notification-dropdown__mark-all"
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-dropdown__content">
            {loading ? (
              <div className="notification-dropdown__loading">
                <div className="loader"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-dropdown__empty">
                <FaBell className="notification-dropdown__empty-icon" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={getNotificationLink(notification)}
                  className={`notification-dropdown__item ${
                    !notification.is_read ? 'notification-dropdown__item--unread' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-dropdown__item-content">
                    <p className="notification-dropdown__message">
                      {formatNotificationMessage(notification)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="notification-dropdown__unread-dot"></div>
                  )}
                </Link>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-dropdown__footer">
              <Link to="/notifications" onClick={() => setIsOpen(false)}>
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;