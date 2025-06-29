import { Link } from 'react-router-dom';
import logo from '../../assets/logo/logo.png';
import './Legal.scss';

const Terms = () => {
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
          <h1>Terms of Service</h1>
          <p className="legal__updated">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>Agreement to Terms</h2>
            <p>
              By accessing and using Sports Social, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2>Description of Service</h2>
            <p>
              Sports Social is a platform that connects sports enthusiasts, allowing them to find local games, share experiences, and build communities around their favorite sports.
            </p>
          </section>

          <section>
            <h2>User Accounts</h2>
            <ul>
              <li>You must provide accurate and complete information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 13 years old to use our service</li>
              <li>One person may not maintain multiple accounts</li>
            </ul>
          </section>

          <section>
            <h2>Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Post harmful, offensive, or inappropriate content</li>
              <li>Harass, bully, or threaten other users</li>
              <li>Share false or misleading information</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Attempt to hack or disrupt our service</li>
            </ul>
          </section>

          <section>
            <h2>Content and Intellectual Property</h2>
            <ul>
              <li>You retain ownership of content you post</li>
              <li>You grant us a license to use your content to provide our service</li>
              <li>Our platform and its features are protected by intellectual property laws</li>
            </ul>
          </section>

          <section>
            <h2>Privacy</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service.
            </p>
          </section>

          <section>
            <h2>Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violations of these terms. You may also delete your account at any time.
            </p>
          </section>

          <section>
            <h2>Disclaimers and Limitation of Liability</h2>
            <p>
              Sports Social is provided "as is" without warranties. We are not liable for any damages arising from your use of our service.
            </p>
          </section>

          <section>
            <h2>Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of significant changes.
            </p>
          </section>

          <section>
            <h2>Contact Information</h2>
            <p>
              Questions about these Terms of Service should be sent to:{' '}
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

export default Terms;
