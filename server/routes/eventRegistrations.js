import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { sendEventRegistrationEmail } from '../services/emailService.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle ES module dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase credentials are available
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  console.error('Required variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('Current values:', { supabaseUrl, supabaseKey: supabaseKey ? '[REDACTED]' : undefined });
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * @route   POST /api/event-registrations
 * @desc    Register for an event
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { event_id, event_title, name, email, phone, country_code, team_name, extra } = req.body;
    
    if (!event_title || !name || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate phone number: should be only numbers and exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ 
        error: 'Phone number must be exactly 10 digits and contain only numbers' 
      });
    }
    
    // Concatenate country code with phone number
    const fullPhoneNumber = (country_code || '+91') + phone;
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('event_registrations')
      .insert([
        { 
          event_id, 
          event_title,
          name,
          email,
          phone: fullPhoneNumber,
          team_name,
          extra
        }
      ])
      .select();
      
    if (error) {
      console.error('Event registration error:', error);
      return res.status(500).json({ error: 'Failed to register for event' });
    }
    
    // Send confirmation email
    try {
      await sendEventRegistrationEmail(email, name, event_title, team_name);
      console.log('Registration confirmation email sent to:', email);
    } catch (emailError) {
      console.error('Failed to send registration confirmation email:', emailError);
      // Don't fail the registration if email fails, just log it
    }
    
    return res.status(201).json({ 
      success: true, 
      data: data[0],
      message: 'Registration successful! Check your email for confirmation.' 
    });
    
  } catch (err) {
    console.error('Server error in event registration:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/event-registrations
 * @desc    Get all registrations (admin only)
 * @access  Private/Admin
 */
router.get('/', async (req, res) => {
  try {
    // Admin authorization would go here
    
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .order('registration_date', { ascending: false });
      
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch registrations' });
    }
    
    return res.json(data);
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/event-registrations/event/:eventId
 * @desc    Get registrations for a specific event (admin only)
 * @access  Private/Admin
 */
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('registration_date', { ascending: false });
      
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch registrations' });
    }
    
    return res.json(data);
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
