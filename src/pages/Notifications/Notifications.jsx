import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBell, FaCog, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { formatRelativeTime } from '../../utils/dateUtils';
import './Notifications.scss';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [markingIndividual, setMarkingIndividual] = useState(new Set());
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'follow', 'interest', 'nearby_post'
  const [lastSeenId, setLastSeenId] = useState(null);
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications();
    
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
      // Set an empty array as fallback to avoid UI errors
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds) => {
    try {
      await axios.post('/notifications/mark-read', { notificationIds });
      
      // Update the notifications' read status in the state
      setNotifications(prev => 
        prev.map(notif => 
          notificationIds.includes(notif.id) 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      
      // Only remove the notifications from view if we're in the unread filter
      if (filter === 'unread') {
        setNotifications(prev => 
          prev.filter(notif => !notificationIds.includes(notif.id))
        );
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (markingAllRead) return;
    
    try {
      setMarkingAllRead(true);
      
      // First attempt to mark all as read using the dedicated endpoint
      try {
        await axios.post('/notifications/mark-all-read');
        // Success with the main endpoint
      } catch (error) {
        console.warn('Failed to mark all as read, using fallback method:', error);
        
        // Fallback: Get all unread notification IDs and mark them read individually
        const unreadIds = notifications
          .filter(notif => !notif.is_read)
          .map(notif => notif.id);
        
        if (unreadIds.length > 0) {
          await axios.post('/notifications/mark-read', { 
            notificationIds: unreadIds 
          });
        }
      }
      
      // Update the read status of all notifications
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      // If we're in the unread filter, clear the list since there are no more unread notifications
      if (filter === 'unread') {
        setNotifications(prev => prev.filter(n => false)); // Empty the array
      }
      
      // Update last seen ID to prevent duplicates
      if (notifications.length > 0) {
        const latestId = notifications[0].id;
        setLastSeenId(latestId);
        localStorage.setItem('lastSeenNotificationId', latestId);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      alert('Failed to mark all notifications as read. Please try again.');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const markIndividualAsRead = async (notificationId) => {
    if (markingIndividual.has(notificationId)) return;
    
    try {
      setMarkingIndividual(prev => new Set([...prev, notificationId]));
      await markAsRead([notificationId]);
      
      // Update the notification's read status in the state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      
      // Only remove the notification from view if we're in the unread filter
      if (filter === 'unread') {
        setNotifications(prev => 
          prev.filter(notif => notif.id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setMarkingIndividual(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markIndividualAsRead(notification.id);
    }
    // We don't navigate away here, as that's handled by the Link component
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
        // If conversation_id is provided in data, navigate directly to that conversation
        return data && data.conversation_id 
          ? `/messages?conversation=${data.conversation_id}` 
          : `/messages`;
      default:
        return '#';
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

  const formatNotificationMessage = (notification) => {
    const timeAgo = formatRelativeTime(notification.created_at);
    
    // Add the time to the message
    return `${notification.message} (${timeAgo})`;
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
          className={`notifications__filter ${filter === 'message' ? 'notifications__filter--active' : ''}`}
          onClick={() => setFilter('message')}
        >
          Messages ({notifications.filter(n => n.type === 'message').length})
        </button>
        <button
          className={`notifications__filter ${filter === 'nearby_post' ? 'notifications__filter--active' : ''}`}
          onClick={() => setFilter('nearby_post')}
        >
          Nearby ({notifications.filter(n => n.type === 'nearby_post').length})
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
              <div
                key={notification.id}
                className={`notifications__item ${
                  !notification.is_read ? 'notifications__item--unread' : ''
                }`}
              >
                <Link
                  to={getNotificationLink(notification)}
                  className="notifications__item-link"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notifications__item-content">
                    <p className="notifications__message">
                      {formatNotificationMessage(notification)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="notifications__unread-dot"></div>
                  )}
                </Link>
                
                {!notification.is_read && (
                  <button
                    className="notifications__mark-read-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      markIndividualAsRead(notification.id);
                    }}
                    disabled={markingIndividual.has(notification.id)}
                    title="Mark as read"
                    aria-label="Mark notification as read"
                  >
                    <FaCheck />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;