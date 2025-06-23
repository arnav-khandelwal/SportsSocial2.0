import express from 'express';
import { Notification } from '../models/Notification.js';
import { UserPreferences } from '../models/UserPreferences.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user notifications
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const notifications = await Notification.getUserNotifications(req.user.id, parseInt(limit));
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      message: 'Server error getting notifications', 
      error: error.message,
      code: error.code
    });
  }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (error) {
    console.error('Get unread notification count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notifications as read
router.post('/mark-read', authenticateToken, async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const updatedCount = await Notification.markAsRead(req.user.id, notificationIds);
    res.json({ updatedCount });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({ 
      message: 'Server error marking notifications as read', 
      error: error.message,
      code: error.code
    });
  }
});

// Mark all notifications as read
router.post('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const updatedCount = await Notification.markAllAsRead(req.user.id);
    res.json({ updatedCount });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ 
      message: 'Server error marking all notifications as read', 
      error: error.message,
      code: error.code
    });
  }
});

// Get user preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const preferences = await UserPreferences.findByUserId(req.user.id);
    res.json(preferences);
  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const preferences = await UserPreferences.upsert({
      user_id: req.user.id,
      ...req.body
    });
    res.json(preferences);
  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;