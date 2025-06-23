import express from 'express';
import { UserSettings } from '../models/UserSettings.js';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get user settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const settings = await UserSettings.getSettings(req.user.id);
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get public user settings (for viewing other users' profiles)
router.get('/public/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = await UserSettings.getSettings(userId);
    
    // Only return public settings for other users
    const publicSettings = {
      profile_picture_url: settings?.profile_picture_url,
      cover_photo_url: settings?.cover_photo_url,
      location_city: settings?.location_city,
      // Only show phone if visibility is public
      phone_number: settings?.phone_visibility === 'public' ? settings?.phone_number : null,
    };
    
    res.json(publicSettings);
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    await UserSettings.updateSettings(req.user.id, req.body);
    const updatedSettings = await UserSettings.getSettings(req.user.id);
    res.json(updatedSettings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user skills
router.get('/skills', authenticateToken, async (req, res) => {
  try {
    const skills = await UserSettings.getSkills(req.user.id);
    res.json(skills);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user skills
router.put('/skills', authenticateToken, async (req, res) => {
  try {
    const { skills } = req.body;
    const updatedSkills = await UserSettings.updateSkills(req.user.id, skills);
    res.json(updatedSkills);
  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user availability
router.get('/availability', authenticateToken, async (req, res) => {
  try {
    const availability = await UserSettings.getAvailability(req.user.id);
    res.json(availability);
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user availability
router.put('/availability', authenticateToken, async (req, res) => {
  try {
    const { availability } = req.body;
    const updatedAvailability = await UserSettings.updateAvailability(req.user.id, availability);
    res.json(updatedAvailability);
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile media
router.post('/media', authenticateToken, async (req, res) => {
  try {
    const { mediaType, fileData } = req.body;
    const media = await UserSettings.uploadProfileMedia(req.user.id, mediaType, fileData);
    res.json(media);
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Verify current password
    const user = await User.findById(req.user.id);
    const isValidPassword = await User.comparePassword(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password in database
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', req.user.id);
    
    if (error) throw error;
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
