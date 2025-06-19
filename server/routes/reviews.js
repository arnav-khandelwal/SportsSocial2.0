import express from 'express';
import { Review } from '../models/Review.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all reviews with optional filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { category, limit = 20 } = req.query;
    
    const filters = {
      category,
      limit: parseInt(limit),
      user_id: req.user.id
    };
    
    const reviews = await Review.findAll(filters);
    res.json(reviews);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get review statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Review.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get review stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's reviews
router.get('/my-reviews', authenticateToken, async (req, res) => {
  try {
    const reviews = await Review.findByAuthor(req.user.id);
    res.json(reviews);
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create review
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      content,
      rating,
      category,
      tags
    } = req.body;

    if (!title || !content || !rating) {
      return res.status(400).json({ message: 'Title, content, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const review = await Review.create({
      author_id: req.user.id,
      title,
      content,
      rating: parseInt(rating),
      category: category || 'general',
      tags: tags || []
    });

    res.status(201).json(review);
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Vote on review
router.post('/:reviewId/vote', authenticateToken, async (req, res) => {
  try {
    const { voteType } = req.body;
    
    if (!['helpful', 'not_helpful'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    await Review.vote(req.params.reviewId, req.user.id, voteType);
    res.json({ message: 'Vote recorded successfully' });
  } catch (error) {
    console.error('Vote on review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove vote from review
router.delete('/:reviewId/vote', authenticateToken, async (req, res) => {
  try {
    await Review.removeVote(req.params.reviewId, req.user.id);
    res.json({ message: 'Vote removed successfully' });
  } catch (error) {
    console.error('Remove vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific review
router.get('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId, req.user.id);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json(review);
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update review
router.put('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this review' });
    }

    const updatedReview = await Review.update(req.params.reviewId, req.body);
    res.json(updatedReview);
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete review
router.delete('/:reviewId', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.author_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.delete(req.params.reviewId);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;