import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaComment, FaUsers, FaSearch, FaUser, FaTimes, FaPlus, FaArrowLeft } from 'react-icons/fa';
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
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ direct: [], group: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('direct'); // Add activeTab state
  const [openedGroupChats, setOpenedGroupChats] = useState(new Set());
  const [showCreateDirectMessageModal, setShowCreateDirectMessageModal] = useState(false);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [followingSearchQuery, setFollowingSearchQuery] = useState('');
  const [followingSearchResults, setFollowingSearchResults] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [showChat, setShowChat] = useState(false);
  const { socket } = useSocket();
  const searchContainerRef = React.useRef(null);

  useEffect(() => {
    fetchConversations();
    loadOpenedGroupChats();
    
    if (location.state) {
      // Handle direct message conversation start
      if (location.state.startConversation) {
        const { startConversation } = location.state;
        setActiveChat({
          id: startConversation.id,
          type: 'direct',
          user: startConversation
        });
      }
      // Handle opening specific group or direct chat
      else if (location.state.activeChat) {
        const { activeChat: chatToOpen } = location.state;
        setActiveChat(chatToOpen);

        // If it's a group chat, mark it as opened
        if (chatToOpen.type === 'group') {
          markGroupChatAsOpened(chatToOpen.id);
        }
      }
      
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

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setIsMobileView(isMobile);
      if (!isMobile) {
        setShowMobileChat(false);
        setShowChat(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update showChat and showMobileChat when activeChat changes
  useEffect(() => {
    if (isMobileView && activeChat) {
      setShowMobileChat(true);
      setShowChat(true);
    }
  }, [activeChat, isMobileView]);

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
      
      // Fetch profile pictures for all direct conversations
      sortedDirectConversations.forEach(conv => {
        if (conv.other_user_id) {
          fetchUserProfile(conv.other_user_id);
        }
      });
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
      conv.other_user_username?.toLowerCase().includes(lowerCaseQuery) ||
      conv.last_message_content?.toLowerCase().includes(lowerCaseQuery)
    );
    
    // Filter group conversations
    const filteredGroup = groupConversations.filter(group => 
      group.name?.toLowerCase().includes(lowerCaseQuery) ||
      group.last_message?.content?.toLowerCase().includes(lowerCaseQuery)
    );
    
    // Sort results by relevance (exact username/group name matches first)
    const sortedDirect = filteredDirect.sort((a, b) => {
      // Exact username matches get highest priority
      const aExactMatch = a.other_user_username?.toLowerCase() === lowerCaseQuery;
      const bExactMatch = b.other_user_username?.toLowerCase() === lowerCaseQuery;
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then sort by starts with
      const aStartsWith = a.other_user_username?.toLowerCase().startsWith(lowerCaseQuery);
      const bStartsWith = b.other_user_username?.toLowerCase().startsWith(lowerCaseQuery);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Finally sort by most recent message
      const aTime = new Date(a.last_message?.created_at || 0).getTime();
      const bTime = new Date(b.last_message?.created_at || 0).getTime();
      return bTime - aTime;
    });
    
    const sortedGroup = filteredGroup.sort((a, b) => {
      // Exact name matches get highest priority
      const aExactMatch = a.name?.toLowerCase() === lowerCaseQuery;
      const bExactMatch = b.name?.toLowerCase() === lowerCaseQuery;
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then sort by starts with
      const aStartsWith = a.name?.toLowerCase().startsWith(lowerCaseQuery);
      const bStartsWith = b.name?.toLowerCase().startsWith(lowerCaseQuery);
      
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;
      
      // Finally sort by most recent message
      const aTime = new Date(a.last_message?.created_at || 0).getTime();
      const bTime = new Date(b.last_message?.created_at || 0).getTime();
      return bTime - aTime;
    });
    
    setSearchResults({
      direct: sortedDirect,
      group: sortedGroup
    });
  };

  const fetchFollowingUsers = async () => {
    try {
      setLoadingFollowing(true);
      
      // Make API call to get following users or use from context
      const following = currentUser?.following || [];
      setFollowingUsers(following);
      setFollowingSearchResults(following);
      
      // Fetch profile pictures for following users
      following.forEach(user => {
        if (user.id) {
          fetchUserProfile(user.id);
        }
      });
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
    
    handleChatClick({ 
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
      <div className="messages__avatar">
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
                        {userProfiles[user.id] ? (
                          <img 
                            src={userProfiles[user.id]} 
                            alt={`${user.username}'s profile`}
                            className="profile-image__avatar"
                          />
                        ) : (
                          <FaUser />
                        )}
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

  const fetchUserProfile = async (profileId) => {
    if (userProfiles[profileId]) return; // Skip if already cached

    try {
      const response = await axios.get(`/settings/public/${profileId}`);
      setUserProfiles((prevProfiles) => ({
        ...prevProfiles,
        [profileId]: response.data.profile_picture_url,
      }));
    } catch (error) {
      console.error(`Failed to fetch profile for user ${profileId}:`, error);
    }
  };

  const fetchConversationsProfiles = async () => {
    // Fetch profile pictures for direct conversations
    directConversations.forEach(conv => {
      if (conv.other_user_id) {
        fetchUserProfile(conv.other_user_id);
      }
    });
  };

  const fetchFollowingProfiles = async () => {
    // Fetch profile pictures for following users
    followingUsers.forEach(user => {
      if (user.id) {
        fetchUserProfile(user.id);
      }
    });
  };

  useEffect(() => {
    fetchConversationsProfiles();
  }, [directConversations]);

  useEffect(() => {
    fetchFollowingProfiles();
  }, [followingUsers]);

  // When a chat is selected, set it as active and show mobile chat if on mobile
  const handleChatClick = (chat) => {
    setActiveChat(chat);
    if (isMobileView) {
      setShowMobileChat(true); 
    }
  };

  // Handle back to conversations list (for mobile)
  const handleBackToConversations = () => {
    if (isMobileView) {
      setShowMobileChat(false);
    }
    // Close the active chat regardless of device
    setActiveChat(null);
  };

  // Use this effect to handle URL changes and reset the mobile chat view if needed
  useEffect(() => {
    if (isMobileView && location.pathname === '/messages') {
      setShowMobileChat(false);
    }
  }, [location.pathname, isMobileView]);

  // --- Search dropdown keyboard navigation state and handlers ---
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const searchResultsRef = React.useRef(null);

  const getTotalSearchResults = () => {
    if (!searchResults) return 0;
    return searchResults.direct.length + searchResults.group.length;
  };

  const handleSearchKeyDown = (e) => {
    const totalResults = getTotalSearchResults();
    if (totalResults === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSearchIndex(prev => (prev + 1) % totalResults);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSearchIndex(prev => (prev <= 0 ? totalResults - 1 : prev - 1));
    } else if (e.key === 'Enter' && selectedSearchIndex >= 0) {
      e.preventDefault();
      let selectedResult;
      if (selectedSearchIndex < searchResults.direct.length) {
        selectedResult = searchResults.direct[selectedSearchIndex];
        handleChatClick({
          id: selectedResult.other_user_id,
          type: 'direct',
          user: {
            id: selectedResult.other_user_id,
            username: selectedResult.other_user_username
          }
        });
      } else {
        const groupIndex = selectedSearchIndex - searchResults.direct.length;
        selectedResult = searchResults.group[groupIndex];
        handleGroupChatClick(selectedResult);
      }
      clearSearch();
    } else if (e.key === 'Escape') {
      clearSearch();
      e.target.blur();
    }
  };

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedSearchIndex(-1);
  }, [searchResults]);

  // Scroll selected item into view when using keyboard navigation
  useEffect(() => {
    if (selectedSearchIndex >= 0 && searchResultsRef.current) {
      const selectedElement = searchResultsRef.current.querySelector(`.search-result-${selectedSearchIndex}`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedSearchIndex]);

  const renderMainContent = () => {
    if (isMobileView && !showChat) {
      return null;
    }

    return (
      <div className="messages__main">
        {isMobileView && activeChat && (
          <button 
            className="messages__back-button"
            onClick={handleBackToConversations}
            aria-label="Back to conversations"
          >
            <FaArrowLeft /> Back
          </button>
        )}
        {activeChat ? (
          activeChat.type === 'direct' ? (
            <DirectMessageThread
              otherUserId={activeChat.id}
              otherUserName={activeChat.user.username}
              onBack={handleBackToConversations}
            />
          ) : (
            <MessageThread
              chatId={activeChat.id}
              chatType={activeChat.type}
              chatName={activeChat.name}
              onBack={handleBackToConversations}
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
    );
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
      <div className={`messages__sidebar ${showMobileChat ? 'hidden-mobile' : ''}`}>
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

        <div className="messages__search" ref={searchContainerRef}>
          <div className="messages__search-input-container">
            <FaSearch className="messages__search-icon" />
            <input
              type="text"
              placeholder="Search your conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              onKeyDown={handleSearchKeyDown}
              className="messages__search-input"
              aria-label="Search conversations"
              aria-expanded={searchQuery && getTotalSearchResults() > 0}
              aria-controls={searchQuery ? "search-results-dropdown" : undefined}
              aria-activedescendant={selectedSearchIndex >= 0 ? `search-result-${selectedSearchIndex}` : undefined}
            />
            {searchQuery && (
              <button
                className="messages__search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {searchQuery && (searchFocused || selectedSearchIndex >= 0) && (
            <div 
              className="messages__search-dropdown" 
              ref={searchResultsRef}
              id="search-results-dropdown"
              role="listbox"
            >
              {searchResults.direct.length > 0 && (
                <div className="messages__search-dropdown-section">
                  <h4>Direct Messages</h4>
                  {searchResults.direct.map((result, index) => {
                    const isSelected = selectedSearchIndex === index;
                    
                    return (
                      <div
                        key={`direct-${result.other_user_id}`}
                        id={`search-result-${index}`}
                        className={`messages__search-result search-result-${index} ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          handleChatClick({
                            id: result.other_user_id,
                            type: 'direct',
                            user: {
                              id: result.other_user_id,
                              username: result.other_user_username
                            }
                          });
                          clearSearch();
                        }}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="messages__search-result-avatar">
                          {userProfiles[result.other_user_id] ? (
                            <img 
                              src={userProfiles[result.other_user_id]} 
                              alt={`${result.other_user_username}'s profile`}
                            />
                          ) : (
                            <FaUser />
                          )}
                        </div>
                        <div className="messages__search-result-info">
                          <h5>{result.other_user_username}</h5>
                          <p>
                            {shouldShowDirectUnreadBadge(result) && (
                              <span className="messages__search-result-badge">{result.unread_count}</span>
                            )}
                            {formatLastMessage(result.last_message_content)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {searchResults.group.length > 0 && (
                <div className="messages__search-dropdown-section">
                  <h4>Group Chats</h4>
                  {searchResults.group.map((result, groupIndex) => {
                    const index = searchResults.direct.length + groupIndex;
                    const isSelected = selectedSearchIndex === index;
                    
                    return (
                      <div
                        key={`group-${result.id}`}
                        id={`search-result-${index}`}
                        className={`messages__search-result search-result-${index} ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          handleGroupChatClick(result);
                          clearSearch();
                        }}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="messages__search-result-avatar">
                          <FaUsers />
                        </div>
                        <div className="messages__search-result-info">
                          <h5>{result.name}</h5>
                          <p>
                            {shouldShowGroupUnreadBadge(result) && (
                              <span className="messages__search-result-badge">{result.unread_count}</span>
                            )}
                            {formatLastMessage(result.last_message?.content)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {searchResults.direct.length === 0 && searchResults.group.length === 0 && searchQuery.trim() !== '' && (
                <div className="messages__search-no-results">
                  <p>No conversations found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="messages__tabs">
          <button
            className={`messages__tab ${activeTab === 'direct' ? 'active' : ''}`}
            onClick={() => setActiveTab('direct')}
            aria-label="Show Direct Messages"
          >
            <FaComment /> 
            <span>Direct Messages</span>
          </button>
          <button
            className={`messages__tab ${activeTab === 'group' ? 'active' : ''}`}
            onClick={() => setActiveTab('group')}
            aria-label="Show Group Chats"
          >
            <FaUsers /> 
            <span>Group Chats</span>
          </button>
        </div>

        <div className="messages__conversations">
          {activeTab === 'direct' ? (
            directConversations.length === 0 ? (
              <p className="messages__empty">No direct messages</p>
            ) : (
              directConversations.map((conv) => (
                <div
                  key={conv.conversation_id || conv.other_user_id}
                  className={`messages__conversation ${isActiveDirect(conv.other_user_id) ? 'active' : ''}`}
                  onClick={() => handleChatClick({
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
                      {userProfiles[conv.other_user_id] ? (
                        <img 
                          src={userProfiles[conv.other_user_id]} 
                          alt={`${conv.other_user_username}'s profile`}
                          className="messages__avatar__image"
                        />
                      ) : (
                        <FaUser />
                      )}
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
            )
          ) : (
            groupConversations.length === 0 ? (
              <p className="messages__empty">No group chats</p>
            ) : (
              groupConversations.map(group => renderGroupChat(group))
            )
          )}
        </div>
      </div>

      <div className={`messages__main ${isMobileView && !showMobileChat ? 'hidden-mobile' : ''}`}>
        {activeChat ? (
          <>
            {/* <div className="messages__chat-header">
              <div className="messages__chat-header-row">
                {isMobileView && (
                  <button
                    className="messages__back-button"
                    onClick={handleBackToConversations}
                    aria-label="Back to conversations"
                  >
                    <FaArrowLeft />
                  </button>
                )}
                {activeChat && (
                  <div className="messages__chat-avatar">
                    {activeChat.type === 'direct' && userProfiles[activeChat.id] ? (
                      <img
                        src={userProfiles[activeChat.id]}
                        alt={activeChat.user.username}
                        className="messages__avatar__image"
                      />
                    ) : (
                      <FaUser />
                    )}
                  </div>
                )}
                <div className="messages__chat-info">
                  <h3>
                    {activeChat.type === 'direct' ? activeChat.user.username : activeChat.name}
                  </h3>
                </div>
              </div>
            </div> */}
            {activeChat.type === 'direct' ? (
              <DirectMessageThread
                otherUserId={activeChat.id}
                otherUserName={activeChat.user.username}
                onBack={handleBackToConversations}
              />
            ) : (
              <MessageThread
                chatId={activeChat.id}
                chatType={activeChat.type}
                chatName={activeChat.name}
                onBack={handleBackToConversations}
              />
            )}
          </>
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