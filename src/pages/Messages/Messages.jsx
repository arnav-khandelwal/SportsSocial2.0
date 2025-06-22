import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaComment, FaUsers, FaSearch, FaUser, FaTimes, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import MessageThread from '../../components/MessageThread/MessageThread';
import DirectMessageThread from '../../components/DirectMessageThread/DirectMessageThread';
import './Messages.scss';

const Messages = () => {
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [directConversations, setDirectConversations] = useState([]);
  const [groupConversations, setGroupConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [openedGroupChats, setOpenedGroupChats] = useState(new Set());
  const { socket } = useSocket();

  useEffect(() => {
    fetchConversations();
    loadOpenedGroupChats();
    
    // Check if we need to start a conversation from navigation state
    if (location.state?.startConversation) {
      const { startConversation } = location.state;
      setActiveChat({
        id: startConversation.id,
        type: 'direct',
        user: startConversation
      });
      
      // Clear the navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (socket) {
      const handleNewDirectMessage = (message) => {
        fetchConversations();
      };

      const handleNewGroupMessage = (message) => {
        fetchConversations();
      };

      const handleDirectMessageDelivered = (message) => {
        fetchConversations();
      };

      socket.on('newDirectMessage', handleNewDirectMessage);
      socket.on('newGroupMessage', handleNewGroupMessage);
      socket.on('directMessageDelivered', handleDirectMessageDelivered);

      return () => {
        socket.off('newDirectMessage', handleNewDirectMessage);
        socket.off('newGroupMessage', handleNewGroupMessage);
        socket.off('directMessageDelivered', handleDirectMessageDelivered);
      };
    }
  }, [socket]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadOpenedGroupChats = () => {
    try {
      const saved = localStorage.getItem(`openedGroupChats_${currentUser?.id}`);
      if (saved) {
        setOpenedGroupChats(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Failed to load opened group chats:', error);
    }
  };

  const saveOpenedGroupChats = (groupChatIds) => {
    try {
      localStorage.setItem(`openedGroupChats_${currentUser?.id}`, JSON.stringify([...groupChatIds]));
    } catch (error) {
      console.error('Failed to save opened group chats:', error);
    }
  };

  const markGroupChatAsOpened = (groupChatId) => {
    setOpenedGroupChats(prev => {
      const newSet = new Set(prev);
      newSet.add(groupChatId);
      saveOpenedGroupChats(newSet);
      return newSet;
    });
  };

  const fetchConversations = async () => {
    try {
      // Fetch direct conversations
      const directResponse = await axios.get('/direct-messages/conversations');
      setDirectConversations(directResponse.data);

      // Fetch group conversations (existing system)
      const groupResponse = await axios.get('/messages/conversations');
      setGroupConversations(groupResponse.data.groupChats || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setSearchLoading(true);
      const response = await axios.get('/users/search', {
        params: { q: searchQuery }
      });
      
      // Filter out current user and get users that can be messaged
      const filteredUsers = response.data.filter(user => user.id !== currentUser?.id);
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const startConversationWithUser = (user) => {
    setActiveChat({
      id: user.id,
      type: 'direct',
      user: user
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const formatLastMessage = (message) => {
    if (!message) return 'No messages yet';
    return message.length > 50 
      ? message.substring(0, 50) + '...'
      : message || 'No messages yet';
  };

  const formatMessageTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else {
        return date.toLocaleDateString([], { 
          month: 'short', 
          day: 'numeric' 
        });
      }
    } catch (error) {
      console.error('Error formatting message time:', error);
      return '';
    }
  };

  const getTotalUnreadCount = () => {
    const directUnread = directConversations.reduce((total, conv) => 
      total + (conv.unread_count || 0), 0
    );
    
    // Only count unread messages from group chats that have been opened by the user
    const groupUnread = groupConversations.reduce((total, group) => {
      if (openedGroupChats.has(group.id)) {
        return total + (group.unread_count || 0);
      }
      return total;
    }, 0);
    
    return directUnread + groupUnread;
  };

  const handleGroupChatClick = (group) => {
    // Mark this group chat as opened when user clicks on it
    markGroupChatAsOpened(group.id);
    
    setActiveChat({ 
      id: group.id, 
      type: 'group', 
      name: group.name 
    });
  };

  const shouldShowGroupUnreadBadge = (group) => {
    // Only show unread badge if the user has opened this group chat before AND there are unread messages
    return openedGroupChats.has(group.id) && group.unread_count > 0;
  };

  if (loading) {
    return (
      <div className="messages">
        <div className="messages__loading">
          <div className="loader"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages">
      <div className="messages__sidebar">
        <div className="messages__header">
          <h2>Messages</h2>
          <div className="messages__header-actions">
            {getTotalUnreadCount() > 0 && (
              <span className="messages__total-unread">{getTotalUnreadCount()}</span>
            )}
          </div>
        </div>

        <div className="messages__search">
          <div className="messages__search-input-container">
            <FaSearch className="messages__search-icon" />
            <input
              type="text"
              placeholder="Search users to message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="messages__search-input"
            />
            {searchQuery && (
              <button
                className="messages__search-clear"
                onClick={clearSearch}
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          {searchLoading && (
            <div className="messages__search-loading">
              <div className="loader"></div>
            </div>
          )}
          
          {searchResults.length > 0 && (
            <div className="messages__search-results">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="messages__search-result"
                  onClick={() => startConversationWithUser(user)}
                >
                  <div className="messages__search-result-avatar">
                    <FaUser />
                  </div>
                  <div className="messages__search-result-info">
                    <h4>{user.username}</h4>
                    {user.bio && <p>{user.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {searchQuery && searchResults.length === 0 && !searchLoading && (
            <div className="messages__search-empty">
              <p>No users found</p>
            </div>
          )}
        </div>

        <div className="messages__conversations">
          <div className="messages__section">
            <h3 className="messages__section-title">
              <FaComment /> Direct Messages
            </h3>
            {directConversations.length === 0 ? (
              <p className="messages__empty">No direct messages</p>
            ) : (
              directConversations.map((conv) => (
                <div
                  key={`direct-${conv.conversation_id}`}
                  className={`messages__conversation ${
                    activeChat?.id === conv.other_user_id && activeChat?.type === 'direct' 
                      ? 'messages__conversation--active' 
                      : ''
                  } ${conv.unread_count > 0 ? 'messages__conversation--unread' : ''}`}
                  onClick={() => setActiveChat({ 
                    id: conv.other_user_id, 
                    type: 'direct', 
                    user: { 
                      id: conv.other_user_id, 
                      username: conv.other_user_username 
                    } 
                  })}
                >
                  <Link 
                    to={`/profile/${conv.other_user_id}`}
                    className="messages__avatar-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="messages__avatar">
                      <FaUser />
                    </div>
                  </Link>
                  <div className="messages__conversation-info">
                    <Link 
                      to={`/profile/${conv.other_user_id}`}
                      className="messages__username-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h4>{conv.other_user_username || 'Unknown User'}</h4>
                    </Link>
                    <p>{formatLastMessage(conv.last_message_content)}</p>
                  </div>
                  <div className="messages__conversation-meta">
                    <div className="messages__conversation-time">
                      {formatMessageTime(conv.last_message_time)}
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="messages__unread-badge">{conv.unread_count}</span>
                    )}
                  </div>
                  {conv.other_user_is_online && (
                    <div className="messages__online-indicator"></div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="messages__section">
            <h3 className="messages__section-title">
              <FaUsers /> Group Chats
            </h3>
            {groupConversations.length === 0 ? (
              <p className="messages__empty">No group chats</p>
            ) : (
              groupConversations.map((group) => (
                <div
                  key={`group-${group.id}`}
                  className={`messages__conversation ${
                    activeChat?.id === group.id && activeChat?.type === 'group' 
                      ? 'messages__conversation--active' 
                      : ''
                  } ${shouldShowGroupUnreadBadge(group) ? 'messages__conversation--unread' : ''}`}
                  onClick={() => handleGroupChatClick(group)}
                >
                  <div className="messages__avatar messages__avatar--group">
                    <FaUsers />
                  </div>
                  <div className="messages__conversation-info">
                    <h4>{group.name}</h4>
                    <p>{formatLastMessage(group.last_message?.content)}</p>
                  </div>
                  <div className="messages__conversation-meta">
                    <div className="messages__conversation-time">
                      {formatMessageTime(group.last_message?.created_at)}
                    </div>
                    {shouldShowGroupUnreadBadge(group) && (
                      <span className="messages__unread-badge">{group.unread_count}</span>
                    )}
                  </div>
                  <div className="messages__member-count">
                    {group.member_ids ? group.member_ids.length : 0}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="messages__main">
        {activeChat ? (
          activeChat.type === 'direct' ? (
            <DirectMessageThread
              otherUserId={activeChat.id}
              otherUserName={activeChat.user.username}
            />
          ) : (
            <MessageThread
              chatId={activeChat.id}
              chatType={activeChat.type}
              chatName={activeChat.name}
            />
          )
        ) : (
          <div className="messages__welcome">
            <FaComment className="messages__welcome-icon" />
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the sidebar or search for users to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;