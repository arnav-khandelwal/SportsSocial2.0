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
import notificationRoutes from './routes/notifications.js';
import reviewRoutes from './routes/reviews.js';

// Import socket handlers
import { handleSocketConnection } from './socket/socketHandlers.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (works without database)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Sports Social API is running',
    timestamp: new Date().toISOString()
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
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  handleSocketConnection(socket, io);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});