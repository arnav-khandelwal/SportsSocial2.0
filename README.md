# Sports Social - 
## (Made with bolt for the World's Largest Hackathon) <br> A social platform for sports and gaming enthusiasts to connect, find local games, and build around their community.

## Features

- **User Authentication**: Secure registration and login
- **Post Creation**: Share sports activities and events
- **Location-based Discovery**: Find sports activities near you
- **Real-time Messaging**: Direct messages and group chats
- **Interest System**: Show interest in posts and join group chats
- **User Profiles**: Customize your sports profile
- **Dark Theme**: Modern dark UI with orange accents

## Tech Stack

### Frontend
- React 18 with Vite
- React Router for navigation
- Socket.io for real-time features
- SCSS for styling
- Axios for API calls

### Backend
- Node.js with Express
- Supabase for database and authentication
- Socket.io for real-time messaging
- JWT for authentication
- PostGIS for geolocation features

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 2. Set up Supabase

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Wait for the project to be ready
4. Go to Settings > API
5. Copy your Project URL and service_role key

### 3. Configure Environment Variables

Update `server/.env` with your actual Supabase credentials:

```env
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-actual-project-ref.supabase.co
SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# JWT Secret
JWT_SECRET=your-secret-key-here-change-in-production
```

### 4. Set up Database Schema

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/20250613191405_plain_silence.sql`
4. Run the migration to create all necessary tables and functions

### 5. Run the Application

```bash
# Start both frontend and backend
npm run dev
```

This will start:
- Frontend on http://localhost:5173
- Backend on http://localhost:5000

## Database Schema

The application uses the following main tables:

- **users**: User profiles and authentication
- **posts**: Sports activity posts
- **post_interests**: User interests in posts
- **messages**: Direct and group messages
- **group_chats**: Group chat rooms
- **user_followers**: Follow relationships

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Posts
- `GET /api/posts` - Get posts with filters
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/interest` - Show interest in post

### Messages
- `GET /api/messages/conversations` - Get user conversations
- `POST /api/messages/direct` - Send direct message
- `POST /api/messages/group` - Send group message

### Users
- `GET /api/users/search` - Search users
- `POST /api/users/:id/follow` - Follow user

## Real-time Features

The application uses Socket.io for real-time features:

- Live messaging (direct and group)
- Online status indicators
- Typing indicators
- Real-time notifications

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
