import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { EmailVerification } from '../models/EmailVerification.js';
import { generateOTP, sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail, sendPasswordResetConfirmationEmail } from '../services/emailService.js';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs'; // Import bcryptjs directly

const router = express.Router();

// Register
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

// Forgot Password - Send OTP
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ 
        success: true,
        message: 'If this email is registered, you will receive a reset code shortly.' 
      });
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP for password reset (with different type)
    const storeResult = await EmailVerification.storeOTP(email, otp, { type: 'password_reset' });
    
    if (!storeResult.success) {
      return res.status(500).json({ message: 'Failed to process reset request' });
    }

    // Send OTP email for password reset
    const emailResult = await sendPasswordResetEmail(email, otp, user.username);
    
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send reset email' });
    }

    res.json({ 
      success: true,
      message: 'Password reset code sent to your email',
      email: email 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Reset OTP
router.post('/verify-reset-otp', [
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

    // Generate a temporary reset token
    const resetToken = jwt.sign(
      { email, purpose: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short expiry for security
    );

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken
    });

  } catch (error) {
    console.error('Verify reset OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail(),
  body('resetToken').exists(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, resetToken, newPassword } = req.body;

    // Verify reset token
    let decodedToken;
    try {
      decodedToken = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    if (decodedToken.email !== email || decodedToken.purpose !== 'password_reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password using bcryptjs (same as User model)
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in database
    const { error } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword, 
        updated_at: new Date().toISOString() 
      })
      .eq('email', email);

    if (error) {
      console.error('Password reset error:', error);
      return res.status(500).json({ message: 'Failed to reset password' });
    }

    // Send confirmation email
    await sendPasswordResetConfirmationEmail(email, user.username);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register
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

export default router;