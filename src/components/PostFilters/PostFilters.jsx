import { useState, useRef, useEffect } from 'react';
import { FaFilter, FaMapMarkerAlt, FaTimes, FaChevronDown, FaCheck, FaGamepad, FaRunning } from 'react-icons/fa';
import LocationPicker from '../LocationPicker/LocationPicker';
import './PostFilters.scss';

// Import game icons
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
  { name: 'Rugby', icon: '�' },
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

const MultiSelectDropdown = ({ options, selectedItems, onChange, placeholder, icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const toggleItem = (item) => {
    if (selectedItems.includes(item.name)) {
      onChange(selectedItems.filter(name => name !== item.name));
    } else {
      onChange([...selectedItems, item.name]);
    }
  };
  
  return (
    <div className="multi-select-dropdown" ref={dropdownRef}>
      <button
        className="multi-select-dropdown__button"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {icon && <span className="multi-select-dropdown__icon">{icon}</span>}
        <span className="multi-select-dropdown__text">
          {selectedItems.length > 0 
            ? `${selectedItems.length} selected` 
            : placeholder}
        </span>
        <FaChevronDown className={`multi-select-dropdown__chevron ${isOpen ? 'multi-select-dropdown__chevron--open' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="multi-select-dropdown__options">
          {options.map((item) => (
            <div 
              key={item.name}
              className={`multi-select-dropdown__option ${selectedItems.includes(item.name) ? 'multi-select-dropdown__option--selected' : ''}`}
              onClick={() => toggleItem(item)}
            >
              <span className="multi-select-dropdown__checkbox">
                {selectedItems.includes(item.name) && <FaCheck />}
              </span>
              <span className="multi-select-dropdown__item-icon">
                {item.useImage ? (
                  <img src={item.icon} alt={item.name} className="multi-select-dropdown__game-icon" />
                ) : (
                  item.icon
                )}
              </span>
              <span className="multi-select-dropdown__item-name">{item.name}</span>
            </div>
          ))}
        </div>
      )}
      
      {selectedItems.length > 0 && (
        <div className="multi-select-dropdown__selected-count">
          <button 
            className="multi-select-dropdown__clear" 
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

const PostFilters = ({ filters, onFilterChange, is_open }) => {
  const [showFilters, setShowFilters] = useState(is_open !== undefined ? is_open : true);
  const [sports, setSports] = useState([]);
  const [esports, setEsports] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [date, setDate] = useState(filters.date || '');
  const [location, setLocation] = useState(filters.location || null);
  const [radius, setRadius] = useState(filters.radius || -1);
  const [tags, setTags] = useState(filters.tags || []);

  // Sync state from filters prop
  useEffect(() => {
    // Sync from filters prop
    setSports(Array.isArray(filters.sports) ? filters.sports : []);
    setEsports(Array.isArray(filters.esports) ? filters.esports : []);
    setFilterType(filters.filterType || 'ALL');
    setDate(filters.date || '');
    setLocation(filters.location || null);
    setRadius(filters.radius || -1);
    setTags(filters.tags || []);
  }, [filters]);

  // Update local state when is_open prop changes
  useEffect(() => {
    if (typeof is_open === 'boolean') {
      setShowFilters(is_open);
    }
  }, [is_open]);

  // Multi-select handlers
  const handleSportsChange = (selected) => {
    setSports(selected);
    if (filterType === 'ESPORTS_ONLY') setFilterType('ALL');
  };
  const handleGamesChange = (selected) => {
    setEsports(selected);
    if (filterType === 'SPORTS_ONLY') setFilterType('ALL');
  };

  // Toggle handlers
  const handleOnlySports = () => {
    setFilterType(filterType === 'SPORTS_ONLY' ? 'ALL' : 'SPORTS_ONLY');
    if (filterType !== 'SPORTS_ONLY') setEsports([]);
  };
  const handleOnlyGames = () => {
    setFilterType(filterType === 'ESPORTS_ONLY' ? 'ALL' : 'ESPORTS_ONLY');
    if (filterType !== 'ESPORTS_ONLY') setSports([]);
  };

  // Apply filters
  const applyFilters = () => {
    onFilterChange({
      sports,
      esports,
      filterType,
      date,
      location,
      radius,
      tags,
    });
  };

  // Clear all
  const clearFilters = () => {
    setSports([]);
    setEsports([]);
    setFilterType('ALL');
    setDate('');
    setLocation(null);
    setRadius(-1);
    setTags([]);
    onFilterChange({
      sports: [],
      esports: [],
      filterType: 'ALL',
      date: '',
      location: null,
      radius: -1,
      tags: [],
    });
  };

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
      // Handle checkbox toggles
      const isChecked = e.target.checked;
      
      // If "only sports" is checked, ensure "only games" is unchecked and vice versa
      if (name === 'onlySports' && isChecked) {
        setFilterType('SPORTS_ONLY');
        setEsports([]);
      } else if (name === 'onlyGames' && isChecked) {
        setFilterType('ESPORTS_ONLY');
        setSports([]);
      }
    } else {
      // Handle regular input changes
      setLocalFilters({
        ...localFilters,
        [name]: value
      });
    }
  };

  const handleLocationSelect = (location) => {
    setLocation(location);
    // Reset radius to default when location changes
    setRadius(location ? 25000 : -1);
  };

  const clearLocation = () => {
    setLocation(null);
    setRadius(-1);
  };

  return (
    <div className="post-filters">
      <button
        className={`post-filters__toggle ${showFilters ? 'post-filters__toggle--active' : ''}`}
        onClick={() => setShowFilters(!showFilters)}
        aria-expanded={showFilters}
        aria-label={showFilters ? 'Hide filters' : 'Show filters'}
      >
        <FaFilter />
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      {showFilters && (
        <div className="post-filters__content">
          <div className="post-filters__section">
            <div className="post-filters__section-header">
              <h3 className="post-filters__section-title">
                <FaRunning className="post-filters__section-icon" />
                Sports
              </h3>
              <div className="post-filters__checkbox-field">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    name="onlySports"
                    checked={filterType === 'SPORTS_ONLY'}
                    onChange={handleOnlySports}
                  />
                  <span className="checkmark"></span>
                  <span>Only</span>
                </label>
              </div>
            </div>
            <div className="post-filters__field">
              <MultiSelectDropdown
                options={SPORTS}
                selectedItems={sports}
                onChange={handleSportsChange}
                placeholder="Select Sports"
                icon={<FaRunning />}
              />
            </div>
          </div>

          <div className="post-filters__section">
            <div className="post-filters__section-header">
              <h3 className="post-filters__section-title">
                <FaGamepad className="post-filters__section-icon" />
                Online Games
              </h3>
              <div className="post-filters__checkbox-field">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    name="onlyGames"
                    checked={filterType === 'ESPORTS_ONLY'}
                    onChange={handleOnlyGames}
                  />
                  <span className="checkmark"></span>
                  <span>Only</span>
                </label>
              </div>
            </div>
            <div className="post-filters__field">
              <MultiSelectDropdown
                options={ONLINE_GAMES}
                selectedItems={esports}
                onChange={handleGamesChange}
                placeholder="Select Online Games"
                icon={<FaGamepad />}
              />
            </div>
          </div>

          <div className="post-filters__section">
            <h3 className="post-filters__section-title">
              <FaMapMarkerAlt className="post-filters__section-icon" />
              Location
            </h3>
            <div className="post-filters__field">
              <LocationPicker
                onLocationSelect={handleLocationSelect}
                initialLocation={location}
                placeholder="Search for a location to find nearby events..."
              />
            </div>

            {location && (
              <div className="post-filters__field">
                <label>Distance from {location.name}</label>
                <select
                  name="radius"
                  value={radius}
                  onChange={handleFilterChange}
                  className="post-filters__select"
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

          <div className="post-filters__section">
            <h3 className="post-filters__section-title">Date</h3>
            <div className="post-filters__field">
              <input
                type="date"
                name="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="post-filters__date-input"
              />
            </div>
          </div>

          <div className="post-filters__actions">
            <button 
              className="post-filters__clear" 
              onClick={clearFilters}
              aria-label="Clear all filters"
            >
              Clear All
            </button>
            <button 
              className="post-filters__apply"
              onClick={applyFilters}
              aria-label="Apply filters"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostFilters;