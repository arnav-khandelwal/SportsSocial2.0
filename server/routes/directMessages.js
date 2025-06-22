import express from 'express';
import { DirectMessage } from '../models/DirectMessage.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get conversation messages between current user and another user
router.get('/conversation/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const { otherUserId } = req.params;
    console.log('Getting conversation between:', req.user.id, 'and', otherUserId);
    
    // Get or create conversation
    const conversationId = await DirectMessage.getOrCreateConversation(req.user.id, otherUserId);
    
    // Get messages
    const messages = await DirectMessage.getConversationMessages(conversationId, req.user.id);
    
    // Mark messages as read
    try {
      await DirectMessage.markMessagesAsRead(conversationId, req.user.id);
    } catch (markReadError) {
      console.error('Error marking messages as read:', markReadError);
      // Don't fail the request if marking as read fails
    }
    
    res.json({
      conversationId,
      messages
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Failed to fetch conversation'
    });
  }
});

// Send a direct message
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    if (!recipientId || !content) {
      return res.status(400).json({ message: 'Recipient ID and content are required' });
    }

    console.log('Sending direct message from:', req.user.id, 'to:', recipientId);

    const message = await DirectMessage.sendMessage(req.user.id, recipientId, content);

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

// Get user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching conversations for user:', req.user.id);
    
    const conversations = await DirectMessage.getUserConversations(req.user.id);
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
    
    const unreadCount = await DirectMessage.getUnreadCount(req.user.id);
    res.json({ count: unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Failed to fetch unread count'
    });
  }
});

// Mark conversation as read
router.post('/mark-read/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    console.log('Marking conversation as read:', conversationId, 'for user:', req.user.id);
    
    await DirectMessage.markMessagesAsRead(conversationId, req.user.id);
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: 'Failed to mark messages as read'
    });
  }
});

export default router;