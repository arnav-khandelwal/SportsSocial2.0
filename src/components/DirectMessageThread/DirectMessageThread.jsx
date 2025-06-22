import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaPaperPlane, FaUser } from 'react-icons/fa';
import axios from 'axios';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import './DirectMessageThread.scss';

const DirectMessageThread = ({ otherUserId, otherUserName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (otherUserId) {
      fetchMessages();
    }
  }, [otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (socket) {
      const handleNewDirectMessage = (message) => {
        // Check if this message is for the current conversation
        if (message.sender_id === otherUserId || 
            (message.sender_id === user.id && message.conversation_id === conversationId)) {
          setMessages(prev => [...prev, {
            id: message.id,
            sender_id: message.sender_id,
            sender_username: message.sender?.username || (message.sender_id === user.id ? user.username : otherUserName),
            content: message.content,
            is_read: message.is_read,
            created_at: message.created_at
          }]);
        }
      };

      const handleDirectMessageDelivered = (message) => {
        // Add the sent message to the list immediately
        if (message.conversation_id === conversationId) {
          setMessages(prev => [...prev, {
            id: message.id,
            sender_id: message.sender_id,
            sender_username: user.username,
            content: message.content,
            is_read: message.is_read,
            created_at: message.created_at
          }]);
        }
      };

      socket.on('newDirectMessage', handleNewDirectMessage);
      socket.on('directMessageDelivered', handleDirectMessageDelivered);

      return () => {
        socket.off('newDirectMessage', handleNewDirectMessage);
        socket.off('directMessageDelivered', handleDirectMessageDelivered);
      };
    }
  }, [socket, otherUserId, user.id, user.username, otherUserName, conversationId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/direct-messages/conversation/${otherUserId}`);
      setMessages(response.data.messages);
      setConversationId(response.data.conversationId);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (socket) {
      socket.emit('sendDirectMessage', {
        recipientId: otherUserId,
        content: newMessage
      });
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
      <div className="direct-message-thread">
        <div className="direct-message-thread__loading">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="direct-message-thread">
      <div className="direct-message-thread__header">
        <Link 
          to={`/profile/${otherUserId}`}
          className="direct-message-thread__avatar-link"
        >
          <div className="direct-message-thread__avatar">
            <FaUser />
          </div>
        </Link>
        <div className="direct-message-thread__info">
          <Link 
            to={`/profile/${otherUserId}`}
            className="direct-message-thread__name-link"
          >
            <h3>{otherUserName}</h3>
          </Link>
          <span>Direct Message</span>
        </div>
      </div>

      <div className="direct-message-thread__messages">
        {messages.length === 0 ? (
          <div className="direct-message-thread__empty">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`direct-message-thread__message ${
                message.sender_id === user.id 
                  ? 'direct-message-thread__message--own' 
                  : 'direct-message-thread__message--other'
              }`}
            >
              {message.sender_id !== user.id && (
                <Link 
                  to={`/profile/${message.sender_id}`}
                  className="direct-message-thread__message-avatar-link"
                >
                  <div className="direct-message-thread__message-avatar">
                    <FaUser />
                  </div>
                </Link>
              )}
              <div className="direct-message-thread__message-content">
                {message.sender_id !== user.id && (
                  <Link 
                    to={`/profile/${message.sender_id}`}
                    className="direct-message-thread__message-sender-link"
                  >
                    <div className="direct-message-thread__message-sender">
                      {message.sender_username}
                    </div>
                  </Link>
                )}
                <div className="direct-message-thread__message-text">
                  {message.content}
                </div>
                <div className="direct-message-thread__message-time">
                  {formatTime(message.created_at)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="direct-message-thread__input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="direct-message-thread__input"
        />
        <button type="submit" className="direct-message-thread__send-btn">
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default DirectMessageThread;