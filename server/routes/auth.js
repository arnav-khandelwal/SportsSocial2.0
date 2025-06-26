import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { EmailVerification } from '../models/EmailVerification.js';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '../services/emailService.js';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Send OTP for registration
router.post('/send-otp', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, bio, sports, tags } = req.body;

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    const existingUserByUsername = await User.findByUsername(username);

    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with user data
    const userData = {
      username,
      email,
      password,
      bio: bio || '',
      sports: sports || [],
      tags: tags || []
    };

    const storeResult = await EmailVerification.storeOTP(email, otp, userData);
    
    if (!storeResult.success) {
      return res.status(500).json({ message: 'Failed to process registration' });
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, username);
    
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({ 
      success: true,
      message: 'Verification OTP sent to your email',
      email: email 
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP and complete registration
router.post('/verify-otp', [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;

    // Verify OTP
    const verifyResult = await EmailVerification.verifyOTP(email, otp);
    
    if (!verifyResult.success) {
      return res.status(400).json({ message: verifyResult.error });
    }

    const userData = verifyResult.data;

    // Create user account
    const user = await User.create({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      bio: userData.bio,
      sports: userData.sports,
      tags: userData.tags
    });

    // Send welcome email
    await sendWelcomeEmail(userData.email, userData.username);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        sports: user.sports,
        tags: user.tags
      }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Resend OTP
router.post('/resend-otp', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Get the latest unverified entry for this email
    const { data } = await supabase
      .from('email_verifications')
      .select('user_data')
      .eq('email', email)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'No pending registration found for this email' });
    }

    const userData = data[0].user_data;

    // Generate new OTP
    const otp = generateOTP();

    // Mark previous OTPs as expired
    await EmailVerification.resendOTP(email);

    // Store new OTP
    const storeResult = await EmailVerification.storeOTP(email, otp, userData);
    
    if (!storeResult.success) {
      return res.status(500).json({ message: 'Failed to generate new OTP' });
    }

    // Send new OTP email
    const emailResult = await sendOTPEmail(email, otp, userData.username);
    
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    res.json({ 
      success: true,
      message: 'New verification OTP sent to your email' 
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register (legacy - keeping for backward compatibility)
router.post('/register', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, bio, sports, tags } = req.body;

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    const existingUserByUsername = await User.findByUsername(username);

    if (existingUserByEmail || existingUserByUsername) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      username,
      email,
      password,
      bio: bio || '',
      sports: sports || [],
      tags: tags || []
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        sports: user.sports,
        tags: user.tags
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update online status
    await User.updateOnlineStatus(user.id, true);

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        sports: user.sports,
        tags: user.tags
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
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
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;