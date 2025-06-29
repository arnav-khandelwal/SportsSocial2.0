import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo/logo.png';
import './Auth.scss';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="auth">
      <div className="auth__container">
        <div className="auth__header">
          <div className="auth__logo">
            <img src={logo} alt="Sports Social Logo" className="auth__logo-image" />
            <h1 className="auth__title">Sports Social</h1>
          </div>
          <h2 className="auth__welcome">Welcome Back</h2>
          <p className="auth__subtitle">Sign in to your Sports Social account to connect with athletes, find local games, and build your sports community.</p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          {error && <div className="auth__error">{error}</div>}

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

          <button type="submit" disabled={loading} className="auth__submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth__footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth__link">
              Sign up for free
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

export default Login;