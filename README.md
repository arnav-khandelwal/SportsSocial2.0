# Sports Social – Connect Through Sports & Esports

**Built for the World's Largest Hackathon (By Bolt)**

A comprehensive social platform for sports and gaming enthusiasts to connect, discover local and online events, create communities, and engage through real-time messaging and reviews.

---

## 🚀 Key Features

### 🔐 **Authentication & User Management**
- **Secure Registration & Login** with JWT tokens
- **Email Verification** with OTP system using NodeMailer
- **User Profiles** with customizable sports skills, bio, and preferences
- **Profile Pictures & Cover Photos** with image upload support
- **User Following System** to connect with other users
- **Phone Number Validation** (10-digit format with real-time formatting)

### 🎯 **Event & Post Management**
- **Location-Based Discovery** with Google Places API integration
- **Create Posts** for both traditional sports and esports events
- **Event Registration System** with unlimited participant support
- **Interest System** - show interest in posts and auto-join group chats
- **Smart Filtering** by sport type, location, and tags
- **Real-time Event Updates** and notifications

### 🗺️ **Location & Mapping**
- **Google Places API Integration** for location search and autocomplete
- **Current Location Detection** using browser geolocation
- **PostGIS Geospatial Queries** for location-based event discovery
- **Interactive Location Picker** with search functionality

### 💬 **Real-time Communication**
- **Direct Messaging** between users
- **Group Chat System** for events and interests
- **Socket.io Integration** for real-time messaging
- **Message Threading** and conversation management
- **Notification System** for messages, follows, and event updates

### ⭐ **Review & Rating System**
- **Create Reviews** for sports venues, equipment, and experiences
- **5-Star Rating System** with category-based reviews
- **Tag-based Organization** for easy discovery
- **Author Profile Integration** with review history

### 🎨 **User Interface & Experience**
- **Modern Dark Theme** with orange accent colors
- **Fully Responsive Design** optimized for desktop, tablet, and mobile
- **SCSS Modular Architecture** for maintainable styling
- **Custom Components** with hover effects and animations
- **Loading States** and error handling throughout the app
- **Accessibility Features** with proper focus management

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with functional components and hooks
- **Vite** for fast development and building
- **React Router v6** for client-side routing
- **SCSS** with modular, responsive design patterns
- **Axios** for HTTP requests with interceptors
- **Socket.io Client** for real-time features
- **React Icons** for consistent iconography
- **Google Maps JavaScript API** via @googlemaps/js-api-loader
- **Leaflet & React Leaflet** for mapping capabilities

### Backend
- **Node.js** with Express.js framework
- **Socket.io** for real-time bidirectional communication
- **Supabase** as Backend-as-a-Service:
  - PostgreSQL database with PostGIS extension
  - Built-in authentication and authorization
  - Row Level Security (RLS) policies
  - Real-time subscriptions
- **JWT** for stateless authentication
- **BCrypt** for password hashing
- **Express Validator** for input validation
- **Nodemailer** for email services (OTP verification)
- **Multer** for file upload handling
- **CORS** for cross-origin resource sharing

---

## ⚡ Quick Start

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd SportsSocial2.0

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install
```

### 2. Supabase Setup
1. Go to [Supabase](https://app.supabase.com) and create a new project
2. Copy your Project URL and Service Role Key from Settings > API
3. Enable PostGIS extension in your database
4. Set up Row Level Security policies

### 3. Google Maps API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Maps JavaScript API and Places API
4. Create credentials (API Key)
5. Add your domain to API key restrictions

### 4. Email Service Setup (Optional)
1. Create a Gmail account for the application
2. Enable 2-Factor Authentication
3. Generate an App Password
4. Add credentials to environment variables

### 5. Configure Environment Variables

**Frontend (`.env`):**
```env
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_API_URL=http://localhost:5001/api
```

**Backend (`server/.env`):**
```env
# Server Configuration
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Email Service (Optional)
EMAIL_USER=your-app-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 6. Database Migration
1. In Supabase dashboard, go to SQL Editor
2. Run all SQL files in `supabase/migrations/` in chronological order:
   - `20250613191405_plain_silence.sql`
   - `20250615183150_dusty_bush.sql`
   - And so on...

### 7. Run the Application
```bash
# Start both frontend and backend
npm run dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- Health Check: http://localhost:5001/api/health

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write meaningful commit messages
- Test thoroughly before submitting
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## � Acknowledgments

- **Bolt** for organizing the world's largest hackathon
- **Supabase** for providing excellent backend services
- **Google** for Maps and Places API
- **Open Source Community** for amazing packages and tools

---

**Made with ❤️ for the global sports & gaming community.**

*Connecting athletes, gamers, and enthusiasts worldwide through the power of technology.*
