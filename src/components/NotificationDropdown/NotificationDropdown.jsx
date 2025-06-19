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
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNotification = (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      };

      socket.on('notification', handleNotification);

      return () => {
        socket.off('notification', handleNotification);
      };
    }
  }, [socket]);

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
      const response = await axios.get('/notifications');
      setNotifications(response.data);
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
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
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
    // Use the message directly from the database which already has the proper format
    return notification.message;
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
                    <span className="notification-dropdown__time">
                      {formatRelativeTime(notification.created_at)}
                    </span>
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