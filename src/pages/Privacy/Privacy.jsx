import { Link } from 'react-router-dom';
import logo from '../../assets/logo/logo.png';
import './Legal.scss';

const Privacy = () => {
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
          <h1>Privacy Policy</h1>
          <p className="legal__updated">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>Introduction</h2>
            <p>
              Sports Social is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our sports social networking platform.
            </p>
          </section>

          <section>
            <h2>Information We Collect</h2>
            <h3>Personal Information</h3>
            <ul>
              <li>Name and email address</li>
              <li>Profile information (bio, location, sports interests)</li>
              <li>Posts, messages, and other content you create</li>
            </ul>
            
            <h3>Automatically Collected Information</h3>
            <ul>
              <li>Device information and IP address</li>
              <li>Usage data and analytics</li>
              <li>Location data (with your permission)</li>
            </ul>
          </section>

          <section>
            <h2>How We Use Your Information</h2>
            <ul>
              <li>To provide and maintain our service</li>
              <li>To connect you with other sports enthusiasts</li>
              <li>To send you notifications about events and activities</li>
              <li>To improve our platform and user experience</li>
            </ul>
          </section>

          <section>
            <h2>Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share information in the following circumstances:
            </p>
            <ul>
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who help us operate our platform</li>
            </ul>
          </section>

          <section>
            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and update your personal information</li>
              <li>Delete your account and data</li>
              <li>Opt out of certain communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section>
            <h2>Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:connect.sportssocial@gmail.com">connect.sportssocial@gmail.com</a>
            </p>
          </section>
        </div>

        <div className="legal__footer">
          <Link to="/">← Back to Sports Social</Link>
          <Link to="/login" className="back-to-login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
