import express from 'express';
import { Message } from '../models/Message.js';
import { GroupChat } from '../models/GroupChat.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get direct messages between two users
router.get('/direct/:userId', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching direct messages between:', req.user.id, 'and', req.params.userId);
    
    const messages = await Message.findDirectMessages(req.user.id, req.params.userId);
    
    // Mark messages as read
    try {
      await Message.markDirectMessagesAsRead(req.user.id, req.params.userId);
    } catch (markReadError) {
      console.error('Error marking messages as read:', markReadError);
      // Don't fail the request if marking as read fails
    }
    
    res.json(messages);
  } catch (error) {
    console.error('Get direct messages error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Failed to fetch direct messages'
    });
  }
});

// Get group chat messages
router.get('/group/:groupId', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching group messages for group:', req.params.groupId, 'user:', req.user.id);
    
    const groupChat = await GroupChat.findById(req.params.groupId);
    
    if (!groupChat || !groupChat.member_ids.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.findGroupMessages(req.params.groupId);
    
    // Mark group messages as read
    try {
      await Message.markGroupMessagesAsRead(req.params.groupId, req.user.id);
    } catch (markReadError) {
      console.error('Error marking group messages as read:', markReadError);
      // Don't fail the request if marking as read fails
    }
    
    res.json(messages);
  } catch (error) {
    console.error('Get group messages error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Failed to fetch group messages'
    });
  }
});

// Send direct message
router.post('/direct', authenticateToken, async (req, res) => {
  try {
    const { recipient, content } = req.body;

    if (!recipient || !content) {
      return res.status(400).json({ message: 'Recipient and content are required' });
    }

    console.log('Sending direct message from:', req.user.id, 'to:', recipient);

    const message = await Message.create({
      sender_id: req.user.id,
      recipient_id: recipient,
      content,
      message_type: 'direct'
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send direct message error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Failed to send direct message'
    });
  }
});

// Send group message
router.post('/group', authenticateToken, async (req, res) => {
  try {
    const { groupChat, content } = req.body;

    if (!groupChat || !content) {
      return res.status(400).json({ message: 'Group chat ID and content are required' });
    }

    console.log('Sending group message to group:', groupChat, 'from user:', req.user.id);

    const group = await GroupChat.findById(groupChat);
    
    if (!group || !group.member_ids.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = await Message.create({
      sender_id: req.user.id,
      group_chat_id: groupChat,
      content,
      message_type: 'group'
    });

    // Update group chat's last message
    try {
      await GroupChat.updateLastMessage(groupChat, message.id);
    } catch (updateError) {
      console.error('Error updating group chat last message:', updateError);
      // Don't fail the request if updating last message fails
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send group message error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Failed to send group message'
    });
  }
});

// Get user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching conversations for user:', req.user.id);
    
    const conversations = await Message.getConversations(req.user.id);
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Failed to fetch conversations'
    });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching unread count for user:', req.user.id);
    
    const unreadCount = await Message.getUnreadCount(req.user.id);
    res.json(unreadCount);
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Failed to fetch unread count'
    });
  }
});

// Mark message as read
router.post('/mark-read/:messageId', authenticateToken, async (req, res) => {
  try {
    console.log('Marking message as read:', req.params.messageId, 'for user:', req.user.id);
    
    await Message.markAsRead(req.params.messageId, req.user.id);
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Failed to mark message as read'
    });
  }
});

export default router;