import { useState } from 'react';
import { FaFilter, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import LocationPicker from '../LocationPicker/LocationPicker';
import './PostFilters.scss';

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
        { name: 'Table Tennis', icon: '🏓' }
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

const PostFilters = ({ filters, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(true);
  const [localFilters, setLocalFilters] = useState(filters);
  const [isESports, setIsESports] = useState(false);

  const radiusOptions = [
    { value: 1000, label: '1km' },
    { value: 5000, label: '5km' },
    { value: 10000, label: '10km' },
    { value: 25000, label: '25km' },
    { value: 50000, label: '50km' },
    { value: 100000, label: '100km' },
    { value: -1, label: 'No location filter' }
  ];

  const handleFilterChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setLocalFilters({
        ...localFilters,
        [name]: e.target.checked
      });
      if (name === 'isESports') {
        setIsESports(e.target.checked);
      }
    } else {
      setLocalFilters({
        ...localFilters,
        [name]: value
      });
    }
  };

  const handleLocationSelect = (location) => {
    const updatedFilters = { 
      ...localFilters, 
      location,
      // Reset radius to default when location changes
      radius: location ? 25000 : -1
    };
    setLocalFilters(updatedFilters);
  };

  const clearLocation = () => {
    const updatedFilters = { 
      ...localFilters, 
      location: null,
      radius: -1
    };
    setLocalFilters(updatedFilters);
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setLocalFilters({
      sport: '',
      tags: [],
      date: '',
      location: null,
      radius: -1,
      isESports: false
    });
    setIsESports(false);
  };

  return (
    <div className="post-filters">
      <button
        className={`post-filters__toggle ${showFilters ? 'post-filters__toggle--active' : ''}`}
        onClick={() => setShowFilters(!showFilters)}
      >
        <FaFilter />
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      {showFilters && (
        <div className="post-filters__content">
          <div className="post-filters__section">
            <h3>Sport</h3>
            <div className="post-filters__field">
              <SportDropdown
                sport={localFilters.sport}
                isESports={isESports}
                selectedSport={localFilters.sport}
                onSelect={(sport) => {
                  setLocalFilters({ ...localFilters, sport });
                }}
              />
            </div>

            <div className="post-filters__field">
              <label>
                <input
                  type="checkbox"
                  name="isESports"
                  checked={localFilters.isESports}
                  onChange={handleFilterChange}
                />
                E-Sports Only
              </label>
            </div>
          </div>

          <div className="post-filters__section">
            <h3>Date</h3>
            <div className="post-filters__field">
              <input
                type="date"
                name="date"
                value={localFilters.date}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="post-filters__section">
            <h3>Location</h3>
            <div className="post-filters__field">
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={localFilters.location}
                placeholder="Search for a location to find nearby events..."
              />
            </div>

            {localFilters.location && (
              <div className="post-filters__field">
                <label>Distance from {localFilters.location.name}</label>
                <select
                  name="radius"
                  value={localFilters.radius}
                  onChange={handleFilterChange}
                >
                  {radiusOptions.filter(option => option.value !== -1).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="post-filters__actions">
            <button className="post-filters__clear" onClick={clearFilters}>
              Clear All
            </button>
            <button className="post-filters__apply" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostFilters;