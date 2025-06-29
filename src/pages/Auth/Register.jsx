import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OTPVerification from './OTPVerification';
import logo from '../../assets/logo/logo.png';
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
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Helper function to format field names for better user experience
  const formatFieldName = (fieldName) => {
    const fieldMapping = {
      'username': 'Username',
      'email': 'Email',
      'password': 'Password',
      'confirmPassword': 'Confirm Password',
      'bio': 'Bio',
      'sports': 'Sports',
      'tags': 'Tags'
    };
    return fieldMapping[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
  };

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

    // Client-side validation with specific field messages
    if (!formData.username.trim()) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Confirm Password does not match Password');
      setLoading(false);
      return;
    }

    if (!agreeToTerms) {
      setError('You must agree to the Terms and Conditions to register');
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
      console.log('Attempting registration with data:', { 
        ...userData, 
        password: '[HIDDEN]' 
      });

      const response = await axios.post('/auth/send-otp', userData);
      
      console.log('Registration response:', response.data);

      if (response.data.success) {
        setEmailForVerification(formData.email);
        setShowOTPVerification(true);
      } else {
        const errorMessage = response.data.message || response.data.error || 'Failed to send verification email';
        console.error('Registration failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed';
      
      if (error.response?.data) {
        // Server responded with error data
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.errors) {
          // Handle validation errors array with field names
          if (Array.isArray(error.response.data.errors)) {
            const fieldErrors = error.response.data.errors.map(err => {
              // Try to extract field name and message
              const field = err.path || err.param || err.field || 'field';
              const message = err.msg || err.message || err.toString();
              const formattedField = formatFieldName(field);
              
              // If message already contains field name, don't duplicate it
              if (message.toLowerCase().includes(field.toLowerCase())) {
                return message;
              }
              
              return `${formattedField}: ${message}`;
            });
            errorMessage = fieldErrors.join('; ');
          } else {
            errorMessage = 'Validation errors occurred';
          }
        } else {
          errorMessage = `Server error: ${error.response.status} ${error.response.statusText}`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error: Unable to connect to server. Please check your internet connection.';
      } else if (error.message) {
        // Other error
        errorMessage = `Error: ${error.message}`;
      }

      console.error('Processed error message:', errorMessage);
      setError(errorMessage);
    }

    setLoading(false);
  };

  const handleOTPVerified = async (verificationData) => {
    try {
      // Use the auth context login function with token and user data
      const result = await login(verificationData.user, null, verificationData.token);
      
      if (result.success) {
        // Navigate to home page after successful login
        navigate('/');
      } else {
        setError('Failed to complete registration. Please try logging in manually.');
      }
    } catch (error) {
      console.error('Auto-login error:', error);
      setError('Registration completed but auto-login failed. Please login manually.');
    }
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
          <div className="auth__logo">
            <img src={logo} alt="Sports Social Logo" className="auth__logo-image" />
            <h1 className="auth__title">Sports Social</h1>
          </div>
          <h2 className="auth__welcome">Join Our Community</h2>
          <p className="auth__subtitle">Create your Sports Social account to connect with athletes, discover local events, and build your sports community.</p>
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

          <div className="auth__field auth__field--checkbox">
            <label className="auth__checkbox-label">
              <input
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="auth__checkbox"
              />
              <span className="auth__checkbox-text">
                I have read and agree to the{' '}
                <Link to="/terms" target="_blank" rel="noopener noreferrer" className="auth__link">
                  Terms and Conditions
                </Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="auth__link">
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="auth__submit">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth__footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth__link">
              Sign in here
            </Link>
          </p>
          <div className="auth__legal">
            <Link to="/privacy" className="auth__legal-link">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="auth__legal-link">Terms of Service</Link>
            <span>•</span>
            <Link to="/about" className="auth__legal-link">About Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;