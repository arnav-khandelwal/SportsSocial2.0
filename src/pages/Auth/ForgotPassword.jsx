import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo/logo.png';
import './Auth.scss';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/forgot-password', { email });
      
      if (response.data.success) {
        setSuccess(true);
        // Navigate to OTP verification with email
        setTimeout(() => {
          navigate('/reset-password-otp', { state: { email, type: 'reset' } });
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="auth">
        <div className="auth__container">
          <div className="auth__header">
            <div className="auth__logo">
              <img src={logo} alt="Sports Social Logo" className="auth__logo-image" />
              <h1 className="auth__title">Sports Social</h1>
            </div>
            <h2 className="auth__welcome">Check Your Email</h2>
            <p className="auth__subtitle">
              We've sent a password reset code to <strong>{email}</strong>. 
              Please check your inbox and follow the instructions.
            </p>
          </div>
          
          <div className="auth__success">
            <div className="auth__success-icon">📧</div>
            <p>Redirecting to verification page...</p>
          </div>

          <div className="auth__footer">
            <p>
              Didn't receive the email?{' '}
              <button 
                onClick={() => setSuccess(false)} 
                className="auth__link auth__link--button"
              >
                Try again
              </button>
            </p>
            <div className="auth__legal">
              <Link to="/login" className="auth__legal-link">Back to Login</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="auth__container">
        <div className="auth__header">
          <div className="auth__logo">
            <img src={logo} alt="Sports Social Logo" className="auth__logo-image" />
            <h1 className="auth__title">Sports Social</h1>
          </div>
          <h2 className="auth__welcome">Forgot Password</h2>
          <p className="auth__subtitle">
            Enter your email address and we'll send you a code to reset your password.
          </p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          {error && <div className="auth__error">{error}</div>}

          <div className="auth__field">
            <input
              type="email"
              name="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth__input"
            />
          </div>

          <button type="submit" disabled={loading || !email} className="auth__submit">
            {loading ? 'Sending...' : 'Send Reset Code'}
          </button>
        </form>

        <div className="auth__footer">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="auth__link">
              Back to Login
            </Link>
          </p>
          <div className="auth__legal">
            <Link to="/privacy" className="auth__legal-link">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="auth__legal-link">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
