import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
          <h1 className="auth__title">Welcome Back</h1>
          <p className="auth__subtitle">Sign in to Sports Social</p>
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
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;