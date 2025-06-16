import { useState, useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaSearch, FaTimes } from 'react-icons/fa';
import { Loader } from '@googlemaps/js-api-loader';
import './LocationPicker.scss';

const LocationPicker = ({ onLocationSelect, initialLocation, placeholder = "Search for a location..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [loading, setLoading] = useState(false);
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    initializeGoogleMaps();
  }, []);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  const initializeGoogleMaps = async () => {
    try {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY',
        version: 'weekly',
        libraries: ['places']
      });

      const google = await loader.load();
      
      // Create a hidden map element for places service
      const mapElement = document.createElement('div');
      mapRef.current = new google.maps.Map(mapElement, {
        center: { lat: 0, lng: 0 },
        zoom: 1
      });

      autocompleteService.current = new google.maps.places.AutocompleteService();
      placesService.current = new google.maps.places.PlacesService(mapRef.current);
    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 2 && autocompleteService.current) {
      autocompleteService.current.getPlacePredictions(
        {
          input: query,
          types: ['establishment', 'geocode']
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            setPredictions(predictions || []);
          } else {
            setPredictions([]);
          }
        }
      );
    } else {
      setPredictions([]);
    }
  };

  const handlePlaceSelect = (placeId, description) => {
    if (!placesService.current) return;

    setLoading(true);
    placesService.current.getDetails(
      {
        placeId: placeId,
        fields: ['geometry', 'formatted_address', 'name']
      },
      (place, status) => {
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
          const location = {
            name: place.name || place.formatted_address,
            address: place.formatted_address,
            coordinates: [
              place.geometry.location.lng(),
              place.geometry.location.lat()
            ]
          };
          
          setSelectedLocation(location);
          setSearchQuery(location.name);
          setPredictions([]);
          setIsOpen(false);
          onLocationSelect(location);
        }
      }
    );
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            name: 'Current Location',
            address: 'Your current location',
            coordinates: [position.coords.longitude, position.coords.latitude]
          };
          
          setSelectedLocation(location);
          setSearchQuery(location.name);
          setIsOpen(false);
          onLocationSelect(location);
          setLoading(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoading(false);
          alert('Unable to get your current location. Please search manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  const clearLocation = () => {
    setSelectedLocation(null);
    setSearchQuery('');
    onLocationSelect(null);
  };

  return (
    <div className="location-picker">
      <div className="location-picker__input-container">
        <FaMapMarkerAlt className="location-picker__icon" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="location-picker__input"
        />
        {selectedLocation && (
          <button
            type="button"
            onClick={clearLocation}
            className="location-picker__clear"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="location-picker__dropdown">
          <button
            type="button"
            onClick={getCurrentLocation}
            className="location-picker__current-location"
            disabled={loading}
          >
            <FaMapMarkerAlt />
            {loading ? 'Getting location...' : 'Use Current Location'}
          </button>

          {predictions.length > 0 && (
            <div className="location-picker__predictions">
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  type="button"
                  onClick={() => handlePlaceSelect(prediction.place_id, prediction.description)}
                  className="location-picker__prediction"
                >
                  <FaMapMarkerAlt />
                  <div className="location-picker__prediction-text">
                    <div className="location-picker__prediction-main">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="location-picker__prediction-secondary">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchQuery.length > 2 && predictions.length === 0 && !loading && (
            <div className="location-picker__no-results">
              No locations found
            </div>
          )}
        </div>
      )}

      {isOpen && (
        <div 
          className="location-picker__overlay" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LocationPicker;