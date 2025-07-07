import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo/logo.png';
import './Auth.scss';
import './OTPVerification.scss';

const ResetPasswordOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
      return;
    }

    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.querySelector(`input[name="otp-${index + 1}"]`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.querySelector(`input[name="otp-${index - 1}"]`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/verify-reset-otp', {
        email,
        otp: otpCode
      });

      if (response.data.success) {
        // Navigate to new password page with reset token
        navigate('/new-password', { 
          state: { 
            email, 
            resetToken: response.data.resetToken 
          } 
        });
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid verification code. Please try again.');
      setOtp(['', '', '', '', '', '']);
      // Focus first input
      const firstInput = document.querySelector('input[name="otp-0"]');
      if (firstInput) firstInput.focus();
    }

    setLoading(false);
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');

    try {
      await axios.post('/auth/forgot-password', { email });
      setTimer(60);
      setCanResend(false);
      
      // Restart timer
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend code. Please try again.');
    }

    setResendLoading(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="auth">
      <div className="auth__container">
        <div className="auth__header">
          <div className="auth__logo">
            <img src={logo} alt="Sports Social Logo" className="auth__logo-image" />
            <h1 className="auth__title">Sports Social</h1>
          </div>
          <h2 className="auth__welcome">Enter Verification Code</h2>
          <p className="auth__subtitle">
            We've sent a 6-digit verification code to <strong>{email}</strong>
          </p>
        </div>

        <form className="auth__form" onSubmit={handleSubmit}>
          {error && <div className="auth__error">{error}</div>}

          <div className="otp-verification">
            <div className="otp-verification__inputs">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  name={`otp-${index}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength="1"
                  className="otp-verification__input"
                />
              ))}
            </div>

            <div className="otp-verification__timer">
              {!canResend ? (
                <span>Resend code in {formatTime(timer)}</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="otp-verification__resend"
                >
                  {resendLoading ? 'Sending...' : 'Resend Code'}
                </button>
              )}
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || otp.join('').length !== 6} 
            className="auth__submit"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="auth__footer">
          <p>
            Wrong email?{' '}
            <Link to="/forgot-password" className="auth__link">
              Try again
            </Link>
          </p>
          <div className="auth__legal">
            <Link to="/login" className="auth__legal-link">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordOTP;
