import { Link } from 'react-router-dom';
import logo from '../../assets/logo/logo.png';
import './Legal.scss';

const About = () => {
  return (
    <div className="legal">
      <div className="legal__container">
        <div className="legal__header">
          <Link to="/" className="legal__logo">
            <img src={logo} alt="Sports Social Logo" />
            <span>Sports Social</span>
          </Link>
        </div>

        <div className="legal__content">
          <h1>About Sports Social</h1>

          <section>
            <h2>Our Mission</h2>
            <p>
              Sports Social is dedicated to connecting athletes and sports enthusiasts from all backgrounds and skill levels. We believe that sports have the power to bring people together, build communities, and create lasting friendships through a safe and authentic platform.
            </p>
          </section>

          <section>
            <h2>What We Do</h2>
            <p>Our platform enables you to:</p>
            <ul>
              <li>Connect with local athletes and sports enthusiasts</li>
              <li>Discover and join sports events in your area</li>
              <li>Share your sports experiences and achievements</li>
              <li>Find teammates and practice partners</li>
              <li>Build communities around your favorite sports</li>
            </ul>
          </section>

          <section>
            <h2>Our Values</h2>
            <ul>
              <li><strong>Safety:</strong> Providing a secure and respectful environment for all users</li>
              <li><strong>Authenticity:</strong> Encouraging genuine connections and experiences</li>
              <li><strong>Inclusivity:</strong> Everyone is welcome, regardless of skill level or background</li>
              <li><strong>Community:</strong> Building strong, supportive sports communities</li>
            </ul>
          </section>

          <section>
            <h2>How It Started</h2>
            <p>
              Sports Social was founded by a team of passionate athletes who recognized the need for a dedicated platform to connect sports enthusiasts. We experienced firsthand the challenges of finding local games, teammates, and sports communities, and decided to create a solution.
            </p>
          </section>

          <section>
            <h2>Security & Privacy</h2>
            <p>
              Your safety and privacy are our top priorities. We implement industry-standard security measures to protect your personal information and ensure a safe environment for all users. We never sell your data and only use it to improve your experience on our platform.
            </p>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>We'd love to hear from you! Reach out to us:</p>
            <ul>
              <li>General inquiries: <a href="mailto:hello@sportssocial.com">hello@sportssocial.com</a></li>
              <li>Support: <a href="mailto:support@sportssocial.com">support@sportssocial.com</a></li>
              <li>Privacy concerns: <a href="mailto:privacy@sportssocial.com">privacy@sportssocial.com</a></li>
              <li>Community Discord: <a href="https://discord.gg/9wFzcndTBX" target="_blank" rel="noopener noreferrer">Join our Discord</a></li>
            </ul>
          </section>

          <section>
            <h2>Stay Connected</h2>
            <p>Follow us for updates, tips, and community highlights:</p>
            <ul>
              <li>Instagram: <a href="https://www.instagram.com/sportssocial.connect/" target="_blank" rel="noopener noreferrer">@sportssocial.connect</a></li>
              <li>Discord Community: <a href="https://discord.gg/9wFzcndTBX" target="_blank" rel="noopener noreferrer">Sports Social Community</a></li>
            </ul>
          </section>

          <section>
            <h2>Legal Information</h2>
            <div className="legal__links">
              <Link to="/privacy">Privacy Policy</Link>
              <span>•</span>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </section>
        </div>

        <div className="legal__footer">
          <Link to="/">← Back to Sports Social</Link>
        </div>
      </div>
    </div>
  );
};

export default About;
