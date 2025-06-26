import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import configuration
import { testConnection } from './config/supabase.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import messageRoutes from './routes/messages.js';
import directMessageRoutes from './routes/directMessages.js';
import notificationRoutes from './routes/notifications.js';
import reviewRoutes from './routes/reviews.js';
import settingsRoutes from './routes/settings.js';
import eventRegistrationsRoutes from './routes/eventRegistrations.js';

// Import socket handlers
import { handleSocketConnection } from './socket/socketHandlers.js';

dotenv.config();

const app = express();
const server = createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

// Health check endpoint (works without database)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sports Social API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5001,
    frontendUrl: FRONTEND_URL
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Sports Social API',
    version: '1.0.0',
    health: '/api/health'
  });
});

// Test Supabase connection (but don't exit if it fails in development)
testConnection().then((connected) => {
  if (!connected) {
    console.error('⚠️  Failed to connect to Supabase. Please check your configuration.');
    console.error('📋 To fix this:');
    console.error('1. Go to https://app.supabase.com');
    console.error('2. Create a new project or use an existing one');
    console.error('3. Go to Settings > API');
    console.error('4. Copy your Project URL and service_role key');
    console.error('5. Update your .env file with the real values');
    console.error('6. Run the migration SQL in your Supabase SQL editor');
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.error('🔄 Continuing in development mode...');
    }
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/direct-messages', directMessageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/event-registrations', eventRegistrationsRoutes);

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle Supabase PGRST116 errors specifically
  if (error.code === 'PGRST116') {
    return res.status(404).json({ 
      message: 'Resource not found',
      error: 'The requested resource does not exist'
    });
  }
  
  // Handle other known errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Validation error',
      error: error.message 
    });
  }
  
  // Default error response
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl 
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  handleSocketConnection(socket, io);
});

// Global error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('❌ Reason:', reason);
  
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV === 'production') {
    console.error('🚨 Unhandled rejection in production, continuing...');
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🌐 Health check: ${process.env.NODE_ENV === 'production' ? 'https://your-deployed-api.com' : `http://localhost:${PORT}`}/api/health`);
  console.log(`🔗 Frontend URL: ${FRONTEND_URL}`);
  console.log(`🏷️  Environment: ${process.env.NODE_ENV || 'development'}`);
});