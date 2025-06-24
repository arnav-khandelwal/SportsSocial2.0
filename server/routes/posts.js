import express from 'express';
import { Post } from '../models/Post.js';
import { GroupChat } from '../models/GroupChat.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get posts with geolocation filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      sports,
      esports,
      filterType,
      tags, 
      date, 
      lat, 
      lng, 
      radius = 25000,
      page = 1, 
      limit = 10 
    } = req.query;

    // Convert string arrays from query params if needed
    const parseSportParam = (param) => {
      if (!param) return [];
      if (Array.isArray(param)) return param;
      if (typeof param === 'string') {
        return param.split(',').filter(Boolean).map(s => s.trim());
      }
      return [];
    };
    
    const filters = {
      sports: parseSportParam(sports),
      esports: parseSportParam(esports),
      filterType: filterType || 'ALL',
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
      date,
      limit
    };

    const posts = await Post.findNearby(lat, lng, radius, filters);
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      sport,
      heading,
      description,
      tags,
      location,
      locationName,
      eventTime,
      playersNeeded
    } = req.body;

    const post = await Post.create({
      author_id: req.user.id,
      sport,
      heading,
      description,
      tags: tags || [],
      location,
      location_name: locationName,
      event_time: eventTime,
      players_needed: playersNeeded
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Show interest in post
router.post('/:postId/interest', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Add interest
    await Post.addInterest(req.params.postId, req.user.id);

    // Create or update group chat
    let groupChat = await GroupChat.findByPost(post.id);
    
    if (!groupChat) {
      groupChat = await GroupChat.create({
        name: `${post.heading} - Group Chat`,
        post_id: post.id,
        admin_id: post.author_id,
        member_ids: [req.user.id]
      });
    } else {
      await GroupChat.addMember(groupChat.id, req.user.id);
    }

    res.json({ message: 'Interest registered successfully', groupChatId: groupChat.id });
  } catch (error) {
    console.error('Show interest error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts
router.get('/my-posts', authenticateToken, async (req, res) => {
  try {
    const posts = await Post.findByAuthor(req.user.id);
    res.json(posts);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get posts by specific user (for viewing other users' profiles)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const posts = await Post.findByAuthor(userId);
    res.json(posts);
  } catch (error) {
    console.error('Get user posts by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post
router.put('/:postId', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const updatedPost = await Post.update(req.params.postId, req.body);
    res.json(updatedPost);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await Post.delete(req.params.postId);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;