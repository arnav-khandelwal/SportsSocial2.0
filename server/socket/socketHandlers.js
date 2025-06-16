import { Message } from '../models/Message.js';
import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

export const handleSocketConnection = (socket, io) => {
  console.log('User connected:', socket.id);

  // Join user to their own room for notifications
  socket.on('join', async (userId) => {
    socket.join(userId);
    
    // Update user online status
    await User.updateOnlineStatus(userId, true);
    socket.userId = userId;
  });

  // Handle direct messages
  socket.on('sendDirectMessage', async (data) => {
    try {
      const { recipient, content } = data;
      
      const message = await Message.create({
        sender_id: socket.userId,
        recipient_id: recipient,
        content,
        message_type: 'direct'
      });

      // Send to recipient
      io.to(recipient).emit('newDirectMessage', message);
      
      // Send back to sender for confirmation
      socket.emit('messageDelivered', message);

      // Create notification for recipient
      const sender = await User.findById(socket.userId);
      await Notification.create({
        user_id: recipient,
        type: 'message',
        title: 'New message',
        message: `${sender.username} sent you a message: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        data: {
          sender_id: socket.userId,
          message_id: message.id,
          message_type: 'direct'
        }
      });

      // Send notification to recipient
      io.to(recipient).emit('notification', {
        type: 'message',
        title: 'New message',
        message: `${sender.username} sent you a message`,
        data: { sender_id: socket.userId }
      });

    } catch (error) {
      console.error('Direct message error:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Handle group messages
  socket.on('sendGroupMessage', async (data) => {
    try {
      const { groupChat, content } = data;
      
      const message = await Message.create({
        sender_id: socket.userId,
        group_chat_id: groupChat,
        content,
        message_type: 'group'
      });

      // Send to all group members
      io.to(groupChat).emit('newGroupMessage', message);

      // Note: Group message notifications are handled by the database trigger
      // when messages are created, so we don't need to manually create them here

    } catch (error) {
      console.error('Group message error:', error);
      socket.emit('messageError', { error: 'Failed to send message' });
    }
  });

  // Join group chat room
  socket.on('joinGroupChat', (groupChatId) => {
    socket.join(groupChatId);
  });

  // Leave group chat room
  socket.on('leaveGroupChat', (groupChatId) => {
    socket.leave(groupChatId);
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    if (data.type === 'direct') {
      io.to(data.recipient).emit('userTyping', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    } else if (data.type === 'group') {
      socket.to(data.groupChat).emit('userTyping', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    }
  });

  // Handle notification events
  socket.on('sendNotification', async (data) => {
    try {
      const { userId, type, title, message, notificationData } = data;
      
      // Create notification in database
      await Notification.create({
        user_id: userId,
        type,
        title,
        message,
        data: notificationData
      });

      // Send real-time notification
      io.to(userId).emit('notification', {
        type,
        title,
        message,
        data: notificationData
      });

    } catch (error) {
      console.error('Notification error:', error);
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
      // Update user offline status
      await User.updateOnlineStatus(socket.userId, false);
    }
  });
};