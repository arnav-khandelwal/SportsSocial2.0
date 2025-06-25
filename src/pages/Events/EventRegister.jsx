import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone, FaUsers, FaPaperPlane } from 'react-icons/fa';
import axios from 'axios';
import './EventRegister.scss';

const EventRegister = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { eventTitle, eventId } = location.state || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    teamName: '',
    additionalInfo: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Submit registration to API
      const response = await axios.post('/event-registrations', {
        event_title: eventTitle,
        event_id: eventId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        team_name: formData.teamName,
        extra: formData.additionalInfo
      });
      
      setSubmitted(true);
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/events');
  };

  if (!eventTitle) {
    return (
      <div className="event-register">
        <div className="event-register__container">
          <h2>No event selected</h2>
          <p>Please select an event from the events page.</p>
          <button className="event-register__back-btn" onClick={handleBack}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="event-register">
        <div className="event-register__container event-register__success">
          <div className="event-register__success-icon">
            <FaPaperPlane />
          </div>
          <h2>Registration Complete!</h2>
          <p>You have successfully registered for:</p>
          <h3>{eventTitle}</h3>
          <p>Check your email for confirmation and further details.</p>
          <button className="event-register__back-btn" onClick={handleBack}>
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-register">
      <div className="event-register__container">
        <h2 className="event-register__title">Register for Event</h2>
        <h3 className="event-register__event-title">{eventTitle}</h3>
        
        <form className="event-register__form" onSubmit={handleSubmit}>
          <div className="event-register__form-group">
            <label htmlFor="name" className="event-register__label">
              <FaUser /> Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="event-register__input"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="event-register__form-group">
            <label htmlFor="email" className="event-register__label">
              <FaEnvelope /> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="event-register__input"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="event-register__form-group">
            <label htmlFor="phone" className="event-register__label">
              <FaPhone /> Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="event-register__input"
              placeholder="Enter your phone number"
              required
            />
          </div>

          <div className="event-register__form-group">
            <label htmlFor="teamName" className="event-register__label">
              <FaUsers /> Team Name (if applicable)
            </label>
            <input
              type="text"
              id="teamName"
              name="teamName"
              value={formData.teamName}
              onChange={handleChange}
              className="event-register__input"
              placeholder="Enter your team name"
            />
          </div>

          <div className="event-register__form-group">
            <label htmlFor="additionalInfo" className="event-register__label">
              Additional Information
            </label>
            <textarea
              id="additionalInfo"
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              className="event-register__textarea"
              placeholder="Any special requirements or information"
              rows={4}
            />
          </div>

          <div className="event-register__actions">
            <button 
              type="button" 
              className="event-register__back-btn"
              onClick={handleBack}
            >
              Back
            </button>
            <button 
              type="submit" 
              className="event-register__submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Register Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventRegister;
