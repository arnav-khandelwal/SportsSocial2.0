import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

// Components
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home/Home';
import Search from './pages/Search/Search';
import Messages from './pages/Messages/Messages';
import Profile from './pages/Profile/Profile';
import CreatePost from './pages/CreatePost/CreatePost';
import PastPosts from './pages/PastPosts/PastPosts';
import Notifications from './pages/Notifications/Notifications';
import Reviews from './pages/Reviews/Reviews';
import CreateReview from './pages/CreateReview/CreateReview';
import Events from './pages/Events/Events';
import EventRegister from './pages/Events/EventRegister';
import About from './pages/About/About';
import Settings from './pages/Settings/Settings';
import BoltBadge from './components/BoltBadge/BoltBadge';

// Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Styles
import './styles/main.scss';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5001/api';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <SocketProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/create-review" element={<CreateReview />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/profile/:userId?" element={<Profile />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/past-posts" element={<PastPosts />} />
            <Route path="/events/register" element={<EventRegister />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/events" element={<Events />} />
            <Route path="/about" element={<About />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </SocketProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <BoltBadge />
    </AuthProvider>
  );
}

export default App;