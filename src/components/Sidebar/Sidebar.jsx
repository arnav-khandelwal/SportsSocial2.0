import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaSearch, 
  FaCalendarAlt, 
  FaHistory, 
  FaComment, 
  FaInfoCircle, 
  FaCog,
  FaTimes,
  FaUser,
  FaStar
} from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './Sidebar.scss';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handleNewMessage = () => {
        fetchUnreadCount();
      };

      socket.on('newDirectMessage', handleNewMessage);
      socket.on('newGroupMessage', handleNewMessage);

      return () => {
        socket.off('newDirectMessage', handleNewMessage);
        socket.off('newGroupMessage', handleNewMessage);
      };
    }
  }, [socket]);

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get('/messages/unread-count');
      setUnreadCount(response.data.total);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Reset unread count when visiting messages page
  useEffect(() => {
    if (location.pathname === '/messages') {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  const menuItems = [
    { path: '/', icon: FaHome, label: 'Home', exact: true },
    { path: '/search', icon: FaSearch, label: 'Search People' },
    { path: '/reviews', icon: FaStar, label: 'Reviews' },
    { path: '/past-posts', icon: FaHistory, label: 'My Posts' },
    { path: '/events', icon: FaCalendarAlt, label: 'Events' },
    { 
      path: '/messages', 
      icon: FaComment, 
      label: 'Messages',
      badge: unreadCount > 0 ? unreadCount : null
    },
    { path: `/profile/${user?.id}`, icon: FaUser, label: 'My Profile' },
    { path: '/settings', icon: FaCog, label: 'Settings' },
    { path: '/about', icon: FaInfoCircle, label: 'About Us' }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {isOpen && <div className="sidebar__overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        

        <nav className="sidebar__nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar__item ${isActive(item.path, item.exact) ? 'sidebar__item--active' : ''}`}
              onClick={onClose}
            >
              <item.icon className="sidebar__icon" />
              <span className="sidebar__label">{item.label}</span>
              {item.badge && (
                <span className="sidebar__badge">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;