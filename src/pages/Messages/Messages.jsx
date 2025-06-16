import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaComment, FaUsers, FaSearch, FaUser } from 'react-icons/fa';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import MessageThread from '../../components/MessageThread/MessageThread';
import './Messages.scss';

const Messages = () => {
  const [conversations, setConversations] = useState({
    directMessages: [],
    groupChats: []
  });
  const [activeChat, setActiveChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNewDirectMessage = (message) => {
        fetchConversations();
      };

      const handleNewGroupMessage = (message) => {
        fetchConversations();
      };

      const handleMessageDelivered = (message) => {
        fetchConversations();
      };

      socket.on('newDirectMessage', handleNewDirectMessage);
      socket.on('newGroupMessage', handleNewGroupMessage);
      socket.on('messageDelivered', handleMessageDelivered);

      return () => {
        socket.off('newDirectMessage', handleNewDirectMessage);
        socket.off('newGroupMessage', handleNewGroupMessage);
        socket.off('messageDelivered', handleMessageDelivered);
      };
    }
  }, [socket]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get('/messages/conversations');
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastMessage = (message) => {
    if (!message) return 'No messages yet';
    return message.content && message.content.length > 50 
      ? message.content.substring(0, 50) + '...'
      : message.content || 'No messages yet';
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
    const directUnread = conversations.directMessages.reduce((total, conv) => 
      total + (conv.unread_count || 0), 0
    );
    const groupUnread = conversations.groupChats.reduce((total, group) => 
      total + (group.unread_count || 0), 0
    );
    return directUnread + groupUnread;
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
          {getTotalUnreadCount() > 0 && (
            <span className="messages__total-unread">{getTotalUnreadCount()}</span>
          )}
        </div>

        <div className="messages__search">
          <FaSearch className="messages__search-icon" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="messages__search-input"
          />
        </div>

        <div className="messages__conversations">
          <div className="messages__section">
            <h3 className="messages__section-title">
              <FaComment /> Direct Messages
            </h3>
            {conversations.directMessages.length === 0 ? (
              <p className="messages__empty">No direct messages</p>
            ) : (
              conversations.directMessages.map((conv) => (
                <div
                  key={`direct-${conv.id}`}
                  className={`messages__conversation ${
                    activeChat?.id === conv.id && activeChat?.type === 'direct' 
                      ? 'messages__conversation--active' 
                      : ''
                  } ${conv.unread_count > 0 ? 'messages__conversation--unread' : ''}`}
                  onClick={() => setActiveChat({ id: conv.id, type: 'direct', user: conv })}
                >
                  <Link 
                    to={`/profile/${conv.id}`}
                    className="messages__avatar-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="messages__avatar">
                      <FaUser />
                    </div>
                  </Link>
                  <div className="messages__conversation-info">
                    <Link 
                      to={`/profile/${conv.id}`}
                      className="messages__username-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h4>{conv.username || 'Unknown User'}</h4>
                    </Link>
                    <p>{formatLastMessage({ content: conv.last_message_content })}</p>
                  </div>
                  <div className="messages__conversation-meta">
                    <div className="messages__conversation-time">
                      {formatMessageTime(conv.last_message_time)}
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="messages__unread-badge">{conv.unread_count}</span>
                    )}
                  </div>
                  {conv.is_online && (
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
            {conversations.groupChats.length === 0 ? (
              <p className="messages__empty">No group chats</p>
            ) : (
              conversations.groupChats.map((group) => (
                <div
                  key={`group-${group.id}`}
                  className={`messages__conversation ${
                    activeChat?.id === group.id && activeChat?.type === 'group' 
                      ? 'messages__conversation--active' 
                      : ''
                  } ${group.unread_count > 0 ? 'messages__conversation--unread' : ''}`}
                  onClick={() => setActiveChat({ id: group.id, type: 'group', name: group.name })}
                >
                  <div className="messages__avatar messages__avatar--group">
                    <FaUsers />
                  </div>
                  <div className="messages__conversation-info">
                    <h4>{group.name}</h4>
                    <p>{formatLastMessage(group.last_message)}</p>
                  </div>
                  <div className="messages__conversation-meta">
                    <div className="messages__conversation-time">
                      {formatMessageTime(group.last_message?.created_at)}
                    </div>
                    {group.unread_count > 0 && (
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
          <MessageThread
            chatId={activeChat.id}
            chatType={activeChat.type}
            chatName={activeChat.type === 'direct' ? activeChat.user.username : activeChat.name}
          />
        ) : (
          <div className="messages__welcome">
            <FaComment className="messages__welcome-icon" />
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the sidebar to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;