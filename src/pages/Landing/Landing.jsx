import React from 'react';
import { Link } from 'react-router-dom';
import './Landing.scss';

function Landing() {
  return (
    <div className="landing-page">
      {/* Top Navigation Bar */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <img src="/logo.png" alt="Sports Social" className="logo-img" />
            <span className="logo-text">Sports Social</span>
          </div>
          
          <div className="nav-links">
            <Link to="/events" className="nav-link">Events</Link>
            <Link to="/register" className="nav-link">Get Started</Link>
            <a href="#" className="nav-link">Download App</a>
            <Link to="/login" className="nav-link sign-in-btn">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Connect with <span className="highlight">Sports Enthusiasts</span> Worldwide
            </h1>
            <p className="hero-description">
              Join the ultimate sports social platform. Share your passion, connect with athletes, 
              discover events, and build your sports community.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary">Get Started</Link>
              <Link to="/events" className="btn btn-secondary">Browse Events</Link>
            </div>
          </div>
          <div className="hero-image">
            <div className="sports-icons">
              <img src="/src/assets/icons/valorant.png" alt="Gaming" className="sport-icon" />
              <img src="/src/assets/icons/NBA2K.png" alt="Basketball" className="sport-icon" />
              <img src="/src/assets/icons/EAFC.png" alt="Football" className="sport-icon" />
              <img src="/src/assets/icons/rocketleague.png" alt="Rocket League" className="sport-icon" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <h2 className="section-title">Why Choose Sports Social?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🏆</div>
              <h3>Join Events</h3>
              <p>Discover and participate in sports events happening around you.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Connect</h3>
              <p>Build connections with fellow sports enthusiasts and athletes.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Share</h3>
              <p>Share your sports moments, achievements, and experiences.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⭐</div>
              <h3>Reviews</h3>
              <p>Rate and review sports events, venues, and equipment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="about-section">
        <div className="about-container">
          <div className="about-content">
            <div className="about-text">
              <h2 className="section-title">About Sports Social</h2>
              <p className="about-description">
                Sports Social is more than just a platform – it's a thriving community where sports 
                enthusiasts, athletes, and fans come together to share their passion. Founded with 
                the vision of connecting people through sports, we believe that every game, every 
                achievement, and every moment matters.
              </p>
              <div className="about-stats">
                <div className="stat-item">
                  <h3>10K+</h3>
                  <p>Active Users</p>
                </div>
                <div className="stat-item">
                  <h3>500+</h3>
                  <p>Events Hosted</p>
                </div>
                <div className="stat-item">
                  <h3>50+</h3>
                  <p>Sports Categories</p>
                </div>
                <div className="stat-item">
                  <h3>24/7</h3>
                  <p>Community Support</p>
                </div>
              </div>
            </div>
            <div className="about-mission">
              <div className="mission-card">
                <h3>Our Mission</h3>
                <p>
                  To create the world's largest and most inclusive sports community where 
                  everyone can discover, participate, and excel in their favorite sports.
                </p>
              </div>
              <div className="mission-card">
                <h3>Our Vision</h3>
                <p>
                  A world where geographical boundaries don't limit sports connections, 
                  and every athlete finds their perfect team and community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Join the Community?</h2>
          <p>Start your sports social journey today</p>
          <Link to="/register" className="btn btn-primary btn-large">Sign Up Now</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-links">
            <Link to="/about">About</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
          <p>&copy; 2025 Sports Social. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
