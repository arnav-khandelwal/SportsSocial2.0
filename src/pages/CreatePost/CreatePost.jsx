import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaUsers } from 'react-icons/fa';
import axios from 'axios';
import LocationPicker from '../../components/LocationPicker/LocationPicker';
import './CreatePost.scss';

const CreatePost = () => {
  const [formData, setFormData] = useState({
    sport: '',
    heading: '',
    description: '',
    tags: '',
    eventTime: '',
    playersNeeded: 1
  });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const sportOptions = [
    'Football', 'Basketball', 'Tennis', 'Soccer', 'Baseball', 
    'Volleyball', 'Swimming', 'Running', 'Cycling', 'Golf',
    'Hockey', 'Cricket', 'Rugby', 'Badminton', 'Table Tennis'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!location) {
      setError('Please select a location for your event.');
      setLoading(false);
      return;
    }

    try {
      const postData = {
        ...formData,
        location: {
          type: 'Point',
          coordinates: location.coordinates
        },
        locationName: location.name,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        playersNeeded: parseInt(formData.playersNeeded)
      };

      await axios.post('/posts', postData);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post">
      <div className="create-post__container">
        <div className="create-post__header">
          <h1 className="create-post__title">Create New Post</h1>
          <p className="create-post__subtitle">Share your sports activity with the community</p>
        </div>

        <form className="create-post__form" onSubmit={handleSubmit}>
          {error && <div className="create-post__error">{error}</div>}

          <div className="create-post__row">
            <div className="create-post__field">
              <label>Sport *</label>
              <select
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                required
              >
                <option value="">Select a sport</option>
                {sportOptions.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            <div className="create-post__field">
              <label>Players Needed *</label>
              <div className="create-post__input-with-icon">
                <FaUsers className="create-post__input-icon" />
                <input
                  type="number"
                  name="playersNeeded"
                  value={formData.playersNeeded}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  required
                />
              </div>
            </div>
          </div>

          <div className="create-post__field">
            <label>Event Title *</label>
            <input
              type="text"
              name="heading"
              value={formData.heading}
              onChange={handleChange}
              placeholder="e.g., Weekend Basketball Game"
              required
              maxLength="100"
            />
          </div>

          <div className="create-post__field">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your event, skill level, what to bring, etc."
              required
              rows="4"
              maxLength="1000"
            />
          </div>

          <div className="create-post__field">
            <label>Tags</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., beginner, competitive, fun (comma separated)"
            />
          </div>

          <div className="create-post__field">
            <label>Event Location *</label>
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialLocation={location}
              placeholder="Search for event location..."
            />
            {location && (
              <div className="create-post__selected-location">
                <span>Selected: {location.name}</span>
              </div>
            )}
          </div>

          <div className="create-post__field">
            <label>Event Date & Time *</label>
            <div className="create-post__input-with-icon">
              <FaCalendarAlt className="create-post__input-icon" />
              <input
                type="datetime-local"
                name="eventTime"
                value={formData.eventTime}
                onChange={handleChange}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          <div className="create-post__actions">
            <button
              type="button"
              className="create-post__cancel"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-post__submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;