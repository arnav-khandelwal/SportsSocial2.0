import { useState, useEffect } from 'react';
import axios from 'axios';
import './OTPVerification.scss';

const OTPVerification = ({ email, onVerified, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (index, value) => {
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
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/auth/verify-otp', {
        email,
        otp: otpValue
      });

      if (response.data.success) {
        onVerified(response.data);
      } else {
        setError(response.data.message || 'Verification failed');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError('');

    try {
      await axios.post('/auth/resend-otp', {
        email
      });
      
      setTimeLeft(600); // Reset timer
      setOtp(['', '', '', '', '', '']); // Clear OTP inputs
      // Focus first input
      const firstInput = document.querySelector('input[name="otp-0"]');
      if (firstInput) firstInput.focus();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="otp-verification">
      <div className="otp-verification__header">
        <h2 className="otp-verification__title">Verify Your Email</h2>
        <p className="otp-verification__subtitle">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>

      <form className="otp-verification__form" onSubmit={handleSubmit}>
        {error && <div className="otp-verification__error">{error}</div>}

        <div className="otp-verification__inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              name={`otp-${index}`}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="otp-verification__input"
              maxLength="1"
              pattern="[0-9]"
              inputMode="numeric"
              autoComplete="off"
            />
          ))}
        </div>

        <div className="otp-verification__timer">
          {timeLeft > 0 ? (
            <span>Code expires in {formatTime(timeLeft)}</span>
          ) : (
            <span className="otp-verification__expired">Code expired</span>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || timeLeft === 0}
          className="otp-verification__submit"
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="otp-verification__actions">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resending}
          className="otp-verification__resend"
        >
          {resending ? 'Sending...' : 'Resend Code'}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="otp-verification__back"
        >
          Change Email
        </button>
      </div>
    </div>
  );
};

export default OTPVerification;
