import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCalendarAlt, FaUsers, FaGamepad, FaTimes, FaChevronDown } from 'react-icons/fa';
import axios from 'axios';
import LocationPicker from '../../components/LocationPicker/LocationPicker';
import './CreatePost.scss';
import valorantIcon from '../../assets/icons/valorant.png';
import bgmiIcon from '../../assets/icons/bgmi.png';
import eafcIcon from '../../assets/icons/EAFC.png';
import nba2kIcon from '../../assets/icons/NBA2K.png';
import leagueOfLegendsIcon from '../../assets/icons/leagueoflegends.png';
import callOfDutyIcon from '../../assets/icons/CallOfDuty.png';
import minecraftIcon from '../../assets/icons/minecraft.png';
import apexLegendsIcon from '../../assets/icons/apexlegends.png';

const SPORTS = [
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
  { name: 'Table Tennis', icon: '🏓' }
];

const ONLINE_GAMES = [
  { name: 'Valorant', icon: valorantIcon, useImage: true },
  { name: 'BGMI', icon: bgmiIcon, useImage: true },
  { name: 'EAFC', icon: eafcIcon, useImage: true },
  { name: 'NBA 2K', icon: nba2kIcon, useImage: true },
  { name: 'League of Legends', icon: leagueOfLegendsIcon, useImage: true },
  { name: 'Call of Duty', icon: callOfDutyIcon, useImage: true },
  { name: 'Minecraft', icon: minecraftIcon, useImage: true },
  { name: 'Apex Legends', icon: apexLegendsIcon, useImage: true },
  { name: 'Other Online Games', icon: '🎮', useImage: false }
];

const SingleSelectDropdown = ({ options, selected, onSelect, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="single-select-dropdown">
      <button
        className="single-select-dropdown__button"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="single-select-dropdown__selected">
          {selected
            ? (<span className="single-select-dropdown__item">
                {options.find(o => o.name === selected)?.useImage
                  ? <img src={options.find(o => o.name === selected).icon} alt={selected} className="single-select-dropdown__game-icon" />
                  : options.find(o => o.name === selected)?.icon}
                <span className="single-select-dropdown__item-name">{selected}</span>
              </span>)
            : placeholder}
        </span>
        <FaChevronDown className={`single-select-dropdown__chevron${isOpen ? ' single-select-dropdown__chevron--open' : ''}`} />
      </button>
      {isOpen && (
        <div className="single-select-dropdown__options">
          {options.map((item) => (
            <div
              key={item.name}
              className={`single-select-dropdown__option${selected === item.name ? ' single-select-dropdown__option--selected' : ''}`}
              onClick={() => {
                onSelect(item.name);
                setIsOpen(false);
              }}
            >
              {item.useImage
                ? <img src={item.icon} alt={item.name} className="single-select-dropdown__game-icon" />
                : item.icon}
              <span className="single-select-dropdown__item-name">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TagInput = ({ tags, onAddTag, onRemoveTag }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' && inputValue.trim()) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        onAddTag(newTag);
        setInputValue('');
      }
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      const newTag = inputValue.trim();
      if (!tags.includes(newTag)) {
        onAddTag(newTag);
      }
      setInputValue('');
    }
  };

  return (
    <div className="create-post__tags-container">
      <div className="create-post__tags-list">
        {tags.map((tag, index) => (
          <span key={index} className="create-post__tag">
            {tag}
            <button
              className="create-post__tag-remove"
              onClick={() => onRemoveTag(tag)}
              title="Remove tag"
            >
              <FaTimes />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Type tags (press space to add)"
          className="create-post__tag-input"
        />
      </div>
    </div>
  );
};

const CreatePost = () => {
  const [formData, setFormData] = useState({
    sport: '',
    heading: '',
    description: '',
    tags: [],
    eventTime: '',
    playersNeeded: '',
    isESports: false
  });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sportType, setSportType] = useState('sports'); // 'sports' or 'onlineGames'
  const navigate = useNavigate();

  const handleAddTag = (tag) => {
    setFormData({
      ...formData,
      tags: [...formData.tags, tag]
    });
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'playersNeeded') {
      // Only allow positive integers
      const num = parseInt(value);
      if (value === '' || (!isNaN(num) && num > 0)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else if (name === 'isESports') {
      setFormData(prev => ({
        ...prev,
        [name]: e.target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!location) {
      setError('Please select a location for your event.');
      setLoading(false);
      return;
    }

    // Validate players needed
    if (!formData.playersNeeded) {
      setError('Please enter the number of players needed');
      setLoading(false);
      return;
    }

    const playersNum = parseInt(formData.playersNeeded);
    if (isNaN(playersNum) || playersNum <= 0) {
      setError('Please enter a valid number greater than 0');
      setLoading(false);
      return;
    }

    try {
      const postData = {
        sport: formData.sport,
        heading: formData.heading,
        description: formData.description,
        tags: formData.tags,
        location: {
          type: 'Point',
          coordinates: location.coordinates
        },
        locationName: location.name,
        eventTime: formData.eventTime,
        playersNeeded: playersNum // Convert to number before sending
      };

      await axios.post('/posts', postData);
      setSuccessMessage('Post created successfully!');
      
      // Wait for 4 seconds before navigating
      setTimeout(() => {
        navigate('/');
      }, 4000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="create-post">
      {successMessage && (
        <div className="create-post__success-message">
          {successMessage}
        </div>
      )}
      <div className="create-post__container">
        <div className="create-post__header">
          <h1 className="create-post__title">Create New Post</h1>
          <p className="create-post__subtitle">Share your sports activity with the community</p>
        </div>

        <form className="create-post__form" onSubmit={handleSubmit}>
          {error && <div className="create-post__error">{error}</div>}

          <div className="create-post__row">
            <div className="create-post__field">
              <label>Type *</label>
              <div className="create-post__type-toggle">
                <button
                  type="button"
                  className={`create-post__type-btn${sportType === 'sports' ? ' create-post__type-btn--active' : ''}`}
                  onClick={() => {
                    setSportType('sports');
                    setFormData({ ...formData, sport: '' });
                  }}
                >
                  Sports
                </button>
                <button
                  type="button"
                  className={`create-post__type-btn${sportType === 'onlineGames' ? ' create-post__type-btn--active' : ''}`}
                  onClick={() => {
                    setSportType('onlineGames');
                    setFormData({ ...formData, sport: '' });
                  }}
                >
                  Online Game
                </button>
              </div>
            </div>
            <div className="create-post__field">
              <label>{sportType === 'sports' ? 'Sport' : 'Online Game'} *</label>
              <SingleSelectDropdown
                options={sportType === 'sports' ? SPORTS : ONLINE_GAMES}
                selected={formData.sport}
                onSelect={(name) => setFormData({ ...formData, sport: name })}
                placeholder={`Select ${sportType === 'sports' ? 'Sport' : 'Online Game'}`}
              />
            </div>
            <div className="create-post__field">
              <label>Players Needed *</label>
              <input
                type="text"
                name="playersNeeded"
                value={formData.playersNeeded}
                onChange={handleChange}
                placeholder="Enter number of players needed"
                required
                pattern="[1-9][0-9]*"
                title="Please enter a number greater than 0"
              />
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
            <label>Tags (Optional)</label>
            <TagInput
              tags={formData.tags}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
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