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
  const [searchResults, setSearchResults] = useState({ direct: [], group: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [openedGroupChats, setOpenedGroupChats] = useState(new Set());
  const [showCreateDirectMessageModal, setShowCreateDirectMessageModal] = useState(false);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followingSearchQuery, setFollowingSearchQuery] = useState('');
  const [followingSearchResults, setFollowingSearchResults] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
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
      filterConversations(searchQuery.trim());
    } else {
      setSearchResults({ direct: [], group: [] });
    }
  }, [searchQuery]);
  
  useEffect(() => {
    if (followingSearchQuery.trim()) {
      filterFollowingUsers(followingSearchQuery.trim());
    } else {
      setFollowingSearchResults(followingUsers);
    }
  }, [followingSearchQuery, followingUsers]);

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
      const sortedDirectConversations = directResponse.data.sort((a, b) => {
        const aTime = new Date(a.last_message?.created_at || 0).getTime();
        const bTime = new Date(b.last_message?.created_at || 0).getTime();
        return bTime - aTime; // Sort newest first
      });
      setDirectConversations(sortedDirectConversations);

      // Fetch group conversations
      const groupResponse = await axios.get('/messages/conversations');
      const sortedGroupConversations = (groupResponse.data.groupChats || []).sort((a, b) => {
        const aTime = new Date(a.last_message?.created_at || 0).getTime();
        const bTime = new Date(b.last_message?.created_at || 0).getTime();
        return bTime - aTime; // Sort newest first
      });
      setGroupConversations(sortedGroupConversations);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = (query) => {
    if (!query.trim()) {
      setSearchResults({ direct: [], group: [] });
      return;
    }

    const lowerCaseQuery = query.toLowerCase();
    
    // Filter direct conversations
    const filteredDirect = directConversations.filter(conv => 
      conv.other_user_username?.toLowerCase().includes(lowerCaseQuery)
    );
    
    // Filter group conversations
    const filteredGroup = groupConversations.filter(group => 
      group.name?.toLowerCase().includes(lowerCaseQuery)
    );
    
    setSearchResults({
      direct: filteredDirect,
      group: filteredGroup
    });
  };

  const fetchFollowingUsers = async () => {
    try {
      setLoadingFollowing(true);
      setFollowingUsers(currentUser?.following || []);
      setFollowingSearchResults(currentUser?.following || []);
    } catch (error) {
      console.error('Failed to fetch following users:', error);
      setFollowingUsers([]);
      setFollowingSearchResults([]);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const filterFollowingUsers = (query) => {
    const lowerCaseQuery = query.toLowerCase();
    const filtered = followingUsers.filter(user => 
      user.username?.toLowerCase().includes(lowerCaseQuery)
    );
    setFollowingSearchResults(filtered);
  };

  const openCreateDirectMessageModal = () => {
    fetchFollowingUsers();
    setShowCreateDirectMessageModal(true);
    setFollowingSearchQuery('');
  };

  const closeCreateDirectMessageModal = () => {
    setShowCreateDirectMessageModal(false);
    setFollowingSearchQuery('');
  };

  const startNewConversation = (user) => {
    setActiveChat({
      id: user.id,
      type: 'direct',
      user: user
    });
    closeCreateDirectMessageModal();
    // Force refresh conversations to ensure the new conversation appears
    fetchConversations();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults({ direct: [], group: [] });
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
    // Only show unread badge if there are unread messages AND it's not currently active
    return group.unread_count > 0 && !(activeChat?.id === group.id && activeChat?.type === 'group');
  };

  const isActiveDirect = (userId) => {
    return activeChat?.id === userId && activeChat?.type === 'direct';
  };

  const isActiveGroup = (groupId) => {
    return activeChat?.id === groupId && activeChat?.type === 'group';
  };

  const shouldShowDirectUnreadBadge = (conv) => {
    return conv.unread_count > 0 && !isActiveDirect(conv.other_user_id);
  };

  const renderGroupChat = (group) => (
    <div
      key={group.id}
      className={`messages__conversation ${isActiveGroup(group.id) ? 'active' : ''}`}
      onClick={() => handleGroupChatClick(group)}
    >
      <div className="messages__conversation-avatar">
        <FaUsers />
      </div>
      <div className="messages__conversation-info">
        <h4 style={{marginLeft:8}}>{group.name}</h4>
        {group.last_message && (
          <p className="messages__conversation-preview">
            {group.last_message.content}
          </p>
        )}
      </div>
      {shouldShowGroupUnreadBadge(group) && (
        <span className="messages__unread-badge">
          {group.unread_count}
        </span>
      )}
    </div>
  );

  const renderCreateDirectMessageModal = () => {
    return showCreateDirectMessageModal ? (
      <div className="modal-overlay">
        <div className="create-direct-message-modal">
          <div className="create-direct-message-modal__header">
            <h3>New Direct Message</h3>
            <button 
              onClick={closeCreateDirectMessageModal}
              className="create-direct-message-modal__close-btn"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
          <div className="create-direct-message-modal__content">
            <div className="create-direct-message-modal__search">
              <FaSearch className="create-direct-message-modal__search-icon" />
              <input
                type="text"
                placeholder="Search people you follow..."
                value={followingSearchQuery}
                onChange={(e) => setFollowingSearchQuery(e.target.value)}
                className="create-direct-message-modal__search-input"
              />
            </div>
            
            {loadingFollowing ? (
              <div className="create-direct-message-modal__loading">
                <div className="loader"></div>
                <p>Loading your following list...</p>
              </div>
            ) : (
              <div className="create-direct-message-modal__users">
                {followingSearchResults && followingSearchResults.length > 0 ? (
                  followingSearchResults.map(user => (
                    <div
                      key={user.id}
                      className="create-direct-message-modal__user"
                      onClick={() => startNewConversation(user)}
                    >
                      <div className="create-direct-message-modal__user-avatar">
                        <FaUser />
                      </div>
                      <div className="create-direct-message-modal__user-info">
                        <h4>{user.username}</h4>
                        {user.bio && <p>{user.bio}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="create-direct-message-modal__empty">
                    <p>
                      {followingUsers.length === 0
                        ? "You are not following anyone yet"
                        : "No users found with that name"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    ) : null;
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
            <button 
              className="messages__new-message-btn" 
              onClick={openCreateDirectMessageModal}
              title="New Direct Message"
            >
              <FaPlus />
            </button>
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
              placeholder="Search your conversations..."
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
          
          {searchQuery && (
            <div className="messages__search-results">
              {searchResults.direct && searchResults.direct.length > 0 && (
                <div className="messages__search-section">
                  <h4 className="messages__search-section-title">Direct Messages</h4>
                  {searchResults.direct.map((conv) => (
                    <div
                      key={`direct-search-${conv.conversation_id || conv.other_user_id}`}
                      className="messages__search-result"
                      onClick={() => setActiveChat({ 
                        id: conv.other_user_id, 
                        type: 'direct', 
                        user: { 
                          id: conv.other_user_id, 
                          username: conv.other_user_username 
                        } 
                      })}
                    >
                      <div className="messages__search-result-avatar">
                        <FaUser />
                      </div>
                      <div className="messages__search-result-info">
                        <h4>{conv.other_user_username}</h4>
                        <p>{formatLastMessage(conv.last_message_content)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchResults.group && searchResults.group.length > 0 && (
                <div className="messages__search-section">
                  <h4 className="messages__search-section-title">Group Chats</h4>
                  {searchResults.group.map((group) => (
                    <div
                      key={`group-search-${group.id}`}
                      className="messages__search-result"
                      onClick={() => handleGroupChatClick(group)}
                    >
                      <div className="messages__search-result-avatar">
                        <FaUsers />
                      </div>
                      <div className="messages__search-result-info">
                        <h4>{group.name}</h4>
                        {group.last_message && (
                          <p>{formatLastMessage(group.last_message.content)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {searchQuery && (!searchResults.direct || searchResults.direct.length === 0) && 
               (!searchResults.group || searchResults.group.length === 0) && (
                <div className="messages__search-empty">
                  <p>No conversations found</p>
                </div>
              )}
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
                    isActiveDirect(conv.other_user_id)
                      ? 'messages__conversation--active' 
                      : ''
                  } ${shouldShowDirectUnreadBadge(conv) ? 'messages__conversation--unread' : ''}`}
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
                    {shouldShowDirectUnreadBadge(conv) && (
                      <span className="messages__unread-badge">{conv.unread_count}</span>
                    )}
                  </div>
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
              groupConversations.map((group) => renderGroupChat(group))
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

      {renderCreateDirectMessageModal()}
    </div>
  );
};

export default Messages;