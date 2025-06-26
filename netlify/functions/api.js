const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sports Social API is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, bio = '', sports = [], tags = [] } = req.body;
    
    // Check if user already exists
    const { data: existingUserByEmail } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    const { data: existingUserByUsername } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (existingUserByEmail || existingUserByUsername) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        password: hashedPassword,
        bio,
        sports,
        tags,
        is_online: false,
        last_seen: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update online status
    await supabase
      .from('users')
      .update({ 
        is_online: true,
        last_seen: new Date().toISOString()
      })
      .eq('id', user.id);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
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

// Auth middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    // Get followers and following
    const { data: followers } = await supabase
      .from('user_followers')
      .select('follower_id, users!user_followers_follower_id_fkey(id, username)')
      .eq('following_id', req.user.id);
    
    const { data: following } = await supabase
      .from('user_followers')
      .select('following_id, users!user_followers_following_id_fkey(id, username)')
      .eq('follower_id', req.user.id);
    
    res.json({
      ...req.user,
      followers: followers?.map(item => item.users) || [],
      following: following?.map(item => item.users) || []
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Posts routes
app.get('/api/posts', authenticateToken, async (req, res) => {
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
      limit = 10 
    } = req.query;

    // Parse arrays from query params
    const parseSportParam = (param) => {
      if (!param) return [];
      if (Array.isArray(param)) return param;
      if (typeof param === 'string') {
        return param.split(',').filter(Boolean).map(s => s.trim());
      }
      return [];
    };
    
    const sportsArray = parseSportParam(sports);
    const esportsArray = parseSportParam(esports);
    const tagsArray = tags ? (Array.isArray(tags) ? tags : [tags]) : [];
    
    let query;
    
    // Use geolocation if provided
    if (lat && lng) {
      const { data: nearbyPostIds, error: rpcError } = await supabase
        .rpc('posts_within_radius', {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius_meters: parseInt(radius)
        });
      
      if (rpcError) throw rpcError;
      
      if (!nearbyPostIds || nearbyPostIds.length === 0) {
        return res.json([]);
      }
      
      // Extract post IDs from RPC result
      const postIds = nearbyPostIds.map(item => item.id);
      
      // Now fetch full post details with relationships
      query = supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey(id, username, bio),
          interested_users:post_interests(user_id, users(id, username))
        `)
        .in('id', postIds)
        .eq('is_active', true)
        .gte('event_time', new Date().toISOString());
    } else {
      // No geolocation provided, use regular query
      query = supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey(id, username, bio),
          interested_users:post_interests(user_id, users(id, username))
        `)
        .eq('is_active', true)
        .gte('event_time', new Date().toISOString());
    }
    
    // Apply sport filtering
    if (filterType === 'SPORTS_ONLY') {
      query = query.eq('sport_type', 'TRADITIONAL');
    } else if (filterType === 'ESPORTS_ONLY') {
      query = query.eq('sport_type', 'ESPORT');
    }
    
    // Apply specific sports filtering if provided
    if ([...sportsArray, ...esportsArray].length > 0) {
      const sportFilters = [...sportsArray, ...esportsArray];
      if (sportFilters.length === 1) {
        query = query.ilike('sport', `%${sportFilters[0]}%`);
      } else {
        const filterString = sportFilters.map(sport => `sport.ilike.%${sport}%`).join(',');
        query = query.or(filterString);
      }
    }
    
    // Apply date filter if provided
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query = query
        .gte('event_time', startDate.toISOString())
        .lt('event_time', endDate.toISOString());
    }
    
    // Apply tags filter if provided
    if (tagsArray.length > 0) {
      query = query.overlaps('tags', tagsArray);
    }
    
    const { data: posts, error } = await query
      .order('event_time', { ascending: true })
      .limit(parseInt(limit));
    
    if (error) throw error;
    
    // If we have geolocation, merge distance information back into posts
    if (lat && lng && nearbyPostIds) {
      const postsWithDistance = posts.map(post => {
        const nearbyPost = nearbyPostIds.find(item => item.id === post.id);
        return {
          ...post,
          distance: nearbyPost ? nearbyPost.distance : null
        };
      });
      
      return res.json(postsWithDistance);
    }
    
    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Event registrations route
app.post('/api/event-registrations', async (req, res) => {
  try {
    const { event_id, event_title, name, email, phone, team_name, extra } = req.body;
    
    if (!event_title || !name || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Insert into Supabase
    const { data, error } = await supabase
      .from('event_registrations')
      .insert([
        { 
          event_id, 
          event_title,
          name,
          email,
          phone,
          team_name,
          extra
        }
      ])
      .select();
      
    if (error) {
      console.error('Event registration error:', error);
      return res.status(500).json({ error: 'Failed to register for event' });
    }
    
    return res.status(201).json({ success: true, data: data[0] });
    
  } catch (err) {
    console.error('Server error in event registration:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Catch-all route
app.use('*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Export the serverless function
module.exports.handler = serverless(app);