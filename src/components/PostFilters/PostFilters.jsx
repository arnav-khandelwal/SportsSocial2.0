import { useState } from 'react';
import { FaFilter, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import LocationPicker from '../LocationPicker/LocationPicker';
import './PostFilters.scss';

const PostFilters = ({ filters, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(true); // Changed to true for expanded on first load
  const [localFilters, setLocalFilters] = useState(filters);

  const sportOptions = [
    'Football', 'Basketball', 'Tennis', 'Soccer', 'Baseball', 
    'Volleyball', 'Swimming', 'Running', 'Cycling', 'Golf'
  ];

  const radiusOptions = [
    { value: 1000, label: '1km' },
    { value: 5000, label: '5km' },
    { value: 10000, label: '10km' },
    { value: 25000, label: '25km' },
    { value: 50000, label: '50km' },
    { value: 100000, label: '100km' },
    { value: -1, label: 'No location filter' }
  ];

  const handleInputChange = (field, value) => {
    const updatedFilters = { ...localFilters, [field]: value };
    setLocalFilters(updatedFilters);
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
    const clearedFilters = {
      sport: '',
      tags: [],
      date: '',
      location: null,
      radius: -1
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="post-filters">
      <div className="post-filters__header">
        <button
          className="post-filters__toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter />
          Filters
        </button>
        
        {localFilters.location && (
          <div className="post-filters__active-location">
            <FaMapMarkerAlt />
            <span>Near {localFilters.location.name}</span>
            <button
              className="post-filters__clear-location"
              onClick={clearLocation}
              title="Clear location filter"
            >
              <FaTimes />
            </button>
          </div>
        )}
      </div>

      {showFilters && (
        <div className="post-filters__panel">
          <div className="post-filters__row">
            <div className="post-filters__field">
              <label>Sport</label>
              <select
                value={localFilters.sport}
                onChange={(e) => handleInputChange('sport', e.target.value)}
              >
                <option value="">All Sports</option>
                {sportOptions.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            <div className="post-filters__field">
              <label>Date</label>
              <input
                type="date"
                value={localFilters.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
              />
            </div>
          </div>

          <div className="post-filters__field">
            <label>Search Location</label>
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
                value={localFilters.radius}
                onChange={(e) => handleInputChange('radius', parseInt(e.target.value))}
              >
                {radiusOptions.filter(option => option.value !== -1).map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

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