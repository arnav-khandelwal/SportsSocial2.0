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
      const newSocket = io('http://localhost:5000');
      
      newSocket.on('connect', () => {
        console.log('Connected to server');
        newSocket.emit('join', user.id);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const sendDirectMessage = (recipientId, content) => {
    if (socket) {
      socket.emit('sendDirectMessage', { recipientId, content });
    }
  };

  const sendGroupMessage = (groupChat, content) => {
    if (socket) {
      socket.emit('sendGroupMessage', { groupChat, content });
    }
  };

  const joinGroupChat = (groupChatId) => {
    if (socket) {
      socket.emit('joinGroupChat', groupChatId);
    }
  };

  const leaveGroupChat = (groupChatId) => {
    if (socket) {
      socket.emit('leaveGroupChat', groupChatId);
    }
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