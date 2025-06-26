import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OTPVerification from './OTPVerification';
import axios from 'axios';
import './Auth.scss';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    sports: '',
    tags: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [emailForVerification, setEmailForVerification] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    const userData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      bio: formData.bio,
      sports: formData.sports.split(',').map(s => s.trim()).filter(s => s),
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
    };

    try {
      const response = await axios.post('/auth/send-otp', userData);
      
      if (response.data.success) {
        setEmailForVerification(formData.email);
        setShowOTPVerification(true);
      } else {
        setError(response.data.message || 'Failed to send verification email');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    }

    setLoading(false);
  };

  const handleOTPVerified = async (verificationData) => {
    // Store the token and user data
    localStorage.setItem('token', verificationData.token);
    
    // Update auth context
    await login(verificationData.user, verificationData.token);
    
    // Navigate to home page
    navigate('/');
  };

  const handleBackToForm = () => {
    setShowOTPVerification(false);
    setEmailForVerification('');
  };

  if (showOTPVerification) {
    return (
      <div className="auth">
        <div className="auth__container">
          <OTPVerification
            email={emailForVerification}
            onVerified={handleOTPVerified}
            onBack={handleBackToForm}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="auth">
      <div className="auth__container">
        <div className="auth__header">
          <h1 className="auth__title">Join Sports Social</h1>
          <p className="auth__subtitle">Connect with sports enthusiasts</p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          {error && <div className="auth__error">{error}</div>}

          <div className="auth__field">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="auth__input"
            />
          </div>

          <div className="auth__field">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
              className="auth__input"
            />
          </div>

          <div className="auth__field">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
              className="auth__input"
            />
          </div>

          <div className="auth__field">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="auth__input"
            />
          </div>

          <div className="auth__field">
            <textarea
              name="bio"
              placeholder="Tell us about yourself (optional)"
              value={formData.bio}
              onChange={handleChange}
              className="auth__textarea"
              rows="3"
            />
          </div>

          <div className="auth__field">
            <input
              type="text"
              name="sports"
              placeholder="Sports you play (comma separated)"
              value={formData.sports}
              onChange={handleChange}
              className="auth__input"
            />
          </div>

          <div className="auth__field">
            <input
              type="text"
              name="tags"
              placeholder="Tags/Interests (comma separated)"
              value={formData.tags}
              onChange={handleChange}
              className="auth__input"
            />
          </div>

          <button type="submit" disabled={loading} className="auth__submit">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth__footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth__link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;