import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo/logo.png';
import './Auth.scss';

const NewPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { email, resetToken } = location.state || {};

  useEffect(() => {
    if (!email || !resetToken) {
      navigate('/forgot-password');
    }
  }, [email, resetToken, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const validatePassword = () => {
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/reset-password', {
        email,
        resetToken,
        newPassword: formData.password
      });

      if (response.data.success) {
        // Show success message and redirect to login
        navigate('/login', { 
          state: { 
            message: 'Password reset successfully! Please log in with your new password.',
            type: 'success'
          } 
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
    }

    setLoading(false);
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (password.length === 0) return { strength: 0, text: '' };
    if (password.length < 6) return { strength: 1, text: 'Too short' };
    if (password.length < 8) return { strength: 2, text: 'Fair' };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { strength: 4, text: 'Strong' };
    }
    return { strength: 3, text: 'Good' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="auth">
      <div className="auth__container">
        <div className="auth__header">
          <div className="auth__logo">
            <img src={logo} alt="Sports Social Logo" className="auth__logo-image" />
            <h1 className="auth__title">Sports Social</h1>
          </div>
          <h2 className="auth__welcome">Create New Password</h2>
          <p className="auth__subtitle">
            Enter a new password for your account. Make sure it's strong and secure.
          </p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          {error && <div className="auth__error">{error}</div>}

          <div className="auth__field">
            <div className="auth__password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="New password"
                value={formData.password}
                onChange={handleChange}
                required
                className="auth__input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth__password-toggle"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {formData.password && (
              <div className="auth__password-strength">
                <div className="auth__password-bar">
                  <div 
                    className={`auth__password-fill auth__password-fill--${passwordStrength.strength}`}
                    style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                  ></div>
                </div>
                <span className="auth__password-text">{passwordStrength.text}</span>
              </div>
            )}
          </div>

          <div className="auth__field">
            <div className="auth__password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="auth__input"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="auth__password-toggle"
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="auth__field-error">Passwords do not match</div>
            )}
          </div>

          <div className="auth__password-requirements">
            <h4>Password Requirements:</h4>
            <ul>
              <li className={formData.password.length >= 6 ? 'valid' : ''}>
                At least 6 characters long
              </li>
              <li className={formData.password.match(/[A-Z]/) ? 'valid' : ''}>
                One uppercase letter (recommended)
              </li>
              <li className={formData.password.match(/[0-9]/) ? 'valid' : ''}>
                One number (recommended)
              </li>
            </ul>
          </div>

          <button 
            type="submit" 
            disabled={loading || !formData.password || !formData.confirmPassword} 
            className="auth__submit"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

        <div className="auth__footer">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="auth__link">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NewPassword;
