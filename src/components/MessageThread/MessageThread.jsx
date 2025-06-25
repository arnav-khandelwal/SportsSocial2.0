import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaPaperPlane, FaUser, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import './MessageThread.scss';

const MessageThread = ({ chatId, chatType, chatName, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [userProfiles, setUserProfiles] = useState({});
  const messagesEndRef = useRef(null);
  const { socket, sendDirectMessage, sendGroupMessage, joinGroupChat, leaveGroupChat } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    fetchMessages();
    
    if (chatType === 'group') {
      joinGroupChat(chatId);
    }

    return () => {
      if (chatType === 'group') {
        leaveGroupChat(chatId);
      }
    };
  }, [chatId, chatType]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      const handleNewDirectMessage = (message) => {
        if (chatType === 'direct') {
          // For direct messages, check if this message is between current user and the chat partner
          const isRelevantMessage = 
            (message.sender_id === user.id && message.recipient_id === parseInt(chatId)) ||
            (message.sender_id === parseInt(chatId) && message.recipient_id === user.id);
          
          if (isRelevantMessage) {
            setMessages(prev => [...prev, message]);
          }
        }
      };

      const handleNewGroupMessage = (message) => {
        if (chatType === 'group' && message.group_chat_id === chatId) {
          setMessages(prev => [...prev, message]);
        }
      };

      const handleMessageDelivered = (message) => {
        // Add the sent message to the list immediately
        if (chatType === 'direct' && message.recipient_id === parseInt(chatId)) {
          setMessages(prev => [...prev, message]);
        } else if (chatType === 'group' && message.group_chat_id === chatId) {
          setMessages(prev => [...prev, message]);
        }
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
  }, [socket, chatId, chatType, user.id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const endpoint = chatType === 'direct' 
        ? `/messages/direct/${chatId}`
        : `/messages/group/${chatId}`;
      
      const response = await axios.get(endpoint);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    const fetchProfilesForMessages = async () => {
      const userIds = messages.map((msg) => msg.sender_id);
      for (const userId of userIds) {
        await fetchUserProfile(userId);
      }
    };

    fetchProfilesForMessages();
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (chatType === 'direct') {
      sendDirectMessage(parseInt(chatId), newMessage);
    } else {
      // For group messages, send the chatId as-is (UUID string)
      sendGroupMessage(chatId, newMessage);
    }

    setNewMessage('');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  if (loading) {
    return (
      <div className="message-thread">
        <div className="message-thread__loading">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  const renderMessage = (message, previousMessage) => {
    const currentDate = new Date(message.created_at).toDateString();
    const previousDate = previousMessage ? new Date(previousMessage.created_at).toDateString() : null;

    return (
      <div key={message.id}>
        {currentDate !== previousDate && (
          <div className="message-thread__date-divider">
            {currentDate}
          </div>
        )}
        <div
          className={`message-thread__message ${
            message.sender_id === user.id
              ? 'message-thread__message--own'
              : 'message-thread__message--other'
          }`}
        >
          {message.sender_id !== user.id && (
            <Link
              to={`/profile/${message.sender_id}`}
              className="message-thread__message-avatar-link"
            >
              <div className="message-thread__message-avatar">
                {userProfiles[message.sender_id] ? (
                  <img
                    src={userProfiles[message.sender_id]}
                    alt="User"
                    className="message-thread__message-avatar-img"
                  />
                ) : (
                  <FaUser />
                )}
              </div>
            </Link>
          )}
          <div className="message-thread__message-content">
            {message.sender_id !== user.id && message.sender && (
              <Link
                to={`/profile/${message.sender_id}`}
                className="message-thread__message-sender-link"
              >
                <div className="message-thread__message-sender">
                  {message.sender.username}
                </div>
              </Link>
            )}
            <div className="message-thread__message-text">
              {message.content}
            </div>
            <div className="message-thread__message-time">
              {formatTime(message.created_at)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="message-thread">
      <div className="message-thread__header-row">
        <button 
          onClick={onBack}
          className="message-thread__back-btn"
          aria-label="Back to conversations"
        >
          <FaArrowLeft />
        </button>
        <div className="message-thread__avatar">
          {chatType === 'group' ? chatName.charAt(0) : <FaUser />}
        </div>
        <div className="message-thread__info">
          <h3>{chatName}</h3>
          <span>{chatType === 'group' ? 'Group Chat' : 'Direct Message'}</span>
        </div>
      </div>

      <div className="message-thread__messages">
        {messages.length === 0 ? (
          <div className="message-thread__empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => renderMessage(message, messages[index - 1]))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-thread__input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="message-thread__input"
        />
        <button type="submit" className="message-thread__send-btn">
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default MessageThread;