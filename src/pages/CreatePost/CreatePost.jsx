import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaUsers, FaGamepad } from 'react-icons/fa';
import axios from 'axios';
import LocationPicker from '../../components/LocationPicker/LocationPicker';
import './CreatePost.scss';

const SportDropdown = ({ sport, isESports, selectedSport, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const sportOptions = isESports
    ? [
        'Valorant', 'BGMI', 'EAFC', 'NBA', 'Other Online Games'
      ]
    : [
        { name: 'Football', icon: '⚽' },
        { name: 'Basketball', icon: '🏀' },
        { name: 'Tennis', icon: '🎾' },
        { name: 'Soccer', icon: '⚽' },
        { name: 'Baseball', icon: '⚾' },
        { name: 'Volleyball', icon: '🏐' },
        { name: 'Swimming', icon: '🏊‍♂️' },
        { name: 'Running', icon: '🏃‍♂️' },
        { name: 'Cycling', icon: '🚴‍♂️' },
        { name: 'Golf', icon: '⛳' },
        { name: 'Hockey', icon: '🏒' },
        { name: 'Cricket', icon: '🏏' },
        { name: 'Rugby', icon: '🏉' },
        { name: 'Badminton', icon: '🏸' },
        { name: 'Table Tennis', icon: '🏓' },
        {name: 'Rugby', icon: '🏉'},
        {name: 'Other', icon: '🎲'},
        
      ];

  return (
    <div className="sport-dropdown">
      <button
        className="sport-dropdown__button"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedSport ? 
          (isESports ? selectedSport : sportOptions.find(s => s.name === selectedSport)?.icon + ' ' + selectedSport) : 
          'Select Sport'}
      </button>
      {isOpen && (
        <div className="sport-dropdown__options">
          {sportOptions.map((sport, index) => (
            <button
              key={index}
              className="sport-dropdown__option"
              onClick={() => {
                onSelect(sport.name);
                setIsOpen(false);
              }}
            >
              {isESports ? sport : sport.icon} {sport.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [isESports, setIsESports] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    if (e.target.name === 'isESports') {
      setIsESports(e.target.checked);
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
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
              <div className="create-post__input-with-icon">
                <FaGamepad className="create-post__input-icon" />
                <SportDropdown
                  sport={formData.sport}
                  isESports={isESports}
                  selectedSport={formData.sport}
                  onSelect={(sport) => {
                    setFormData({ ...formData, sport });
                  }}
                />
              </div>
            </div>

            <div className="create-post__field">
              <label>Is E-Sport?</label>
              <div className="create-post__input-with-icon">
                <FaGamepad className="create-post__input-icon" />
                <input
                  type="checkbox"
                  name="isESports"
                  checked={isESports}
                  onChange={handleChange}
                />
              </div>
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