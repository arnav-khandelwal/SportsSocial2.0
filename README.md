# Sports Social – Connect Through Sports & Esports

**Built for the World's Largest Hackathon (By Bolt)**

A modern social platform for sports and gaming enthusiasts to connect, discover local and online events, and build vibrant communities.

---

## 🚀 Features

- **User Authentication**: Secure registration & login
- **Event Discovery**: Find and join local or online sports & esports events
- **Event Registration**: Register for events with unlimited participation
- **Post Creation**: Share activities, events, and updates
- **Location-based Discovery**: Find activities near you
- **Real-time Messaging**: Direct and group chats
- **Interest System**: Show interest in posts and join group chats
- **User Profiles**: Customizable sports & gaming profiles
- **Dark Theme**: Sleek, modern UI with orange accents
- **Responsive Design**: Optimized for desktop and mobile

---

## 🛠️ Tech Stack

### Frontend
- React 18 + Vite
- React Router
- SCSS (modular, responsive)
- Axios
- Socket.io (real-time)

### Backend
- Node.js + Express
- Supabase (Postgres DB, Auth, Storage)
- Socket.io (real-time messaging)
- JWT (authentication)
- PostGIS (geolocation)

---

## ⚡ Quick Start

### 1. Clone & Install
```bash
# Frontend
npm install
# Backend
cd server && npm install
```

### 2. Supabase Setup
1. Go to [Supabase](https://app.supabase.com)
2. Create a new project
3. Copy your Project URL and Service Role Key from Settings > API

### 3. Configure Environment Variables
Update `server/.env`:
```env
PORT=5001
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-key
```

### 4. Database Migration
1. In Supabase dashboard, go to SQL Editor
2. Run all SQL files in `supabase/migrations/` (in order)

### 5. Run the App
```bash
# Start frontend and backend
npm run dev
```
- Frontend: http://localhost:5173
- Backend: http://localhost:5001

---

## 🗄️ Database Schema (Main Tables)
- `users`: User profiles & auth
- `posts`: Sports & event posts
- `event_registrations`: Event signups (unlimited)
- `messages`: Direct & group messages
- `group_chats`: Group chat rooms
- `user_followers`: Follows

---

## 🔗 API Endpoints (Sample)
- `POST /api/auth/register` – Register
- `POST /api/auth/login` – Login
- `GET /api/posts` – List posts/events
- `POST /api/event-registrations` – Register for event
- `GET /api/messages/conversations` – Get conversations

---

## 💬 Real-time Features
- Live messaging (direct & group)
- Online/typing indicators
- Real-time notifications

---

## 📱 Responsive & Modern UI
- Fully responsive (desktop/mobile)
- Custom event badges with icons (Valorant, Rocket League, Basketball)
- Beautiful dark theme

---

## 🤝 Contributing
1. Fork & branch
2. Make changes
3. Test thoroughly
4. Submit a pull request

---

## 📝 License
MIT License

---

**Made with ❤️ for the global sports & gaming community.**
