import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
      const newSocket = io(BACKEND_URL);
      
      newSocket.on('connect', () => {
        console.log('Connected to server');
        newSocket.emit('join', user.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      newSocket.on('error', (err) => {
        console.error('Socket error:', err);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const sendDirectMessage = (recipientId, content) => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    socket.emit('sendDirectMessage', { recipientId, content }, (error) => {
      if (error) {
        console.error('Failed to send direct message:', error);
      }
    });
  };

  const sendGroupMessage = (groupChat, content) => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    socket.emit('sendGroupMessage', { groupChat, content }, (error) => {
      if (error) {
        console.error('Failed to send group message:', error);
      }
    });
  };

  const joinGroupChat = (groupChatId) => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    socket.emit('joinGroupChat', groupChatId, (error) => {
      if (error) {
        console.error('Failed to join group chat:', error);
      }
    });
  };

  const leaveGroupChat = (groupChatId) => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    socket.emit('leaveGroupChat', groupChatId, (error) => {
      if (error) {
        console.error('Failed to leave group chat:', error);
      }
    });
  };

  const sendDirectTypingIndicator = (recipientId, isTyping) => {
    if (socket) {
      socket.emit('directTyping', { recipientId, isTyping });
    }
  };

  const sendGroupTypingIndicator = (groupChatId, isTyping) => {
    if (socket) {
      socket.emit('groupTyping', { groupChatId, isTyping });
    }
  };

  const value = {
    socket,
    onlineUsers,
    sendDirectMessage,
    sendGroupMessage,
    joinGroupChat,
    leaveGroupChat,
    sendDirectTypingIndicator,
    sendGroupTypingIndicator
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};