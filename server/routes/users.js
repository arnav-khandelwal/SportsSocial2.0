import express from 'express';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Search users
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, sport, tag } = req.query;
    const users = await User.search(q, sport, tag);
    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followers = await User.getFollowers(user.id);
    const following = await User.getFollowing(user.id);

    res.json({
      ...user,
      followers,
      following
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow user
router.post('/:userId/follow', authenticateToken, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);

    if (!userToFollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToFollow.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    await User.follow(req.user.id, userToFollow.id);
    res.json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unfollow user
router.post('/:userId/unfollow', authenticateToken, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);

    if (!userToUnfollow) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.unfollow(req.user.id, userToUnfollow.id);
    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;