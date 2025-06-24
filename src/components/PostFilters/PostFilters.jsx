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

const PostFilters = ({ filters, onFilterChange }) => {
  const [showFilters, setShowFilters] = useState(true);
  const [localFilters, setLocalFilters] = useState({
    ...filters,
    sportsList: filters.sport ? [filters.sport] : [], // Convert single sport to array
    gamesList: [], // New field for selected online games
    onlySports: false, // New checkbox for filtering only sports
    onlyGames: false, // New checkbox for filtering only online games
  });

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
        setLocalFilters({
          ...localFilters,
          onlySports: true,
          onlyGames: false
        });
      } else if (name === 'onlyGames' && isChecked) {
        setLocalFilters({
          ...localFilters,
          onlyGames: true,
          onlySports: false
        });
      } else {
        setLocalFilters({
          ...localFilters,
          [name]: isChecked
        });
      }
    } else {
      // Handle regular input changes
      setLocalFilters({
        ...localFilters,
        [name]: value
      });
    }
  };

  // Handle sports multi-select
  const handleSportsChange = (selectedSports) => {
    setLocalFilters({
      ...localFilters,
      sportsList: selectedSports
    });
  };

  // Handle online games multi-select
  const handleGamesChange = (selectedGames) => {
    setLocalFilters({
      ...localFilters,
      gamesList: selectedGames
    });
  };

  const handleLocationSelect = (location) => {
    setLocalFilters({ 
      ...localFilters, 
      location,
      // Reset radius to default when location changes
      radius: location ? 25000 : -1
    });
  };

  const clearLocation = () => {
    setLocalFilters({ 
      ...localFilters, 
      location: null,
      radius: -1
    });
  };

  const applyFilters = () => {
    // Prepare the filters for the parent component
    // Combine sports and games based on the "only" checkboxes
    let sport = '';
    
    if (localFilters.onlySports && localFilters.sportsList.length > 0) {
      // Only use sports filters
      sport = localFilters.sportsList.join(',');
    } else if (localFilters.onlyGames && localFilters.gamesList.length > 0) {
      // Only use games filters
      sport = localFilters.gamesList.join(',');
    } else if (localFilters.sportsList.length > 0 || localFilters.gamesList.length > 0) {
      // Combine both sports and games
      sport = [...localFilters.sportsList, ...localFilters.gamesList].join(',');
    }
    
    const finalFilters = {
      ...localFilters,
      sport, // Update the single sport string that the API expects
    };
    
    // Remove the internal fields that the API doesn't need
    delete finalFilters.sportsList;
    delete finalFilters.gamesList;
    delete finalFilters.onlySports;
    delete finalFilters.onlyGames;
    
    onFilterChange(finalFilters);
    
    // Don't hide filters automatically to provide better UX
    // setShowFilters(false);
  };

  const clearFilters = () => {
    const clearedFilters = {
      sport: '',
      sportsList: [],
      gamesList: [],
      tags: [],
      date: '',
      location: null,
      radius: -1,
      onlySports: false,
      onlyGames: false
    };
    
    // Update local state
    setLocalFilters(clearedFilters);
    
    // Apply the cleared filters immediately
    const finalFilters = {
      ...clearedFilters,
      sport: ''
    };
    
    // Remove the internal fields that the API doesn't need
    delete finalFilters.sportsList;
    delete finalFilters.gamesList;
    delete finalFilters.onlySports;
    delete finalFilters.onlyGames;
    
    // Pass to parent component to trigger data refresh
    onFilterChange(finalFilters);
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
            <h3 className="post-filters__section-title">
              <FaRunning className="post-filters__section-icon" />
              Sports
            </h3>
            <div className="post-filters__field">
              <MultiSelectDropdown
                options={SPORTS}
                selectedItems={localFilters.sportsList}
                onChange={handleSportsChange}
                placeholder="Select Sports"
                icon={<FaRunning />}
              />
            </div>
            
            <div className="post-filters__field post-filters__checkbox-field">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="onlySports"
                  checked={localFilters.onlySports}
                  onChange={handleFilterChange}
                />
                <span className="checkmark"></span>
                <span>Only Sports</span>
              </label>
            </div>
          </div>

          <div className="post-filters__section">
            <h3 className="post-filters__section-title">
              <FaGamepad className="post-filters__section-icon" />
              E Sports
            </h3>
            <div className="post-filters__field">
              <MultiSelectDropdown
                options={ONLINE_GAMES}
                selectedItems={localFilters.gamesList}
                onChange={handleGamesChange}
                placeholder="Select E Sports"
                icon={<FaGamepad />}
              />
            </div>
            
            <div className="post-filters__field post-filters__checkbox-field">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="onlyGames"
                  checked={localFilters.onlyGames}
                  onChange={handleFilterChange}
                />
                <span className="checkmark"></span>
                <span>Only E Sports</span>
              </label>
            </div>
          </div>

          <div className="post-filters__section">
            <h3 className="post-filters__section-title">Date</h3>
            <div className="post-filters__field">
              <input
                type="date"
                name="date"
                value={localFilters.date || ''}
                onChange={handleFilterChange}
                className="post-filters__date-input"
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