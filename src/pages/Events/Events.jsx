import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaClock,
  FaPlus,
  FaFilter,
  FaUser,
  FaDollarSign,
  FaTags,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimes
} from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';
import './Events.scss';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: '',
    skillLevel: '',
    date: '',
    location: null,
    radius: -1,
    maxCost: '',
    equipmentProvided: false
  });
  const [showFilters, setShowFilters] = useState(true);

  const sportOptions = [
    'Football', 'Basketball', 'Tennis', 'Soccer', 'Baseball', 
    'Volleyball', 'Swimming', 'Running', 'Cycling', 'Golf',
    'Hockey', 'Cricket', 'Rugby', 'Badminton', 'Table Tennis'
  ];

  const skillLevels = [
    { value: 'all', label: 'All Levels' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        sport: filters.sport,
        skill_level: filters.skillLevel,
        date: filters.date,
        radius: filters.radius,
        max_cost: filters.maxCost,
        equipment_provided: filters.equipmentProvided
      };

      if (filters.location && filters.radius !== -1) {
        params.lat = filters.location.coordinates[1];
        params.lng = filters.location.coordinates[0];
      }

      // For now, we'll use a mock API call since the backend routes don't exist yet
      // const response = await axios.get('/events', { params });
      
      // Mock data for demonstration
      const mockEvents = [
        {
          id: '1',
          title: 'Weekend Basketball Tournament',
          description: 'Join us for an exciting basketball tournament! All skill levels welcome.',
          sport: 'Basketball',
          organizer: { id: '1', username: 'john_doe' },
          location_name: 'Central Park Basketball Courts',
          event_date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
          duration_hours: 4,
          max_participants: 16,
          current_participants: 8,
          skill_level: 'all',
          equipment_provided: true,
          cost: 0,
          tags: ['tournament', 'competitive', 'outdoor'],
          created_at: new Date().toISOString(),
          distance: 2500
        },
        {
          id: '2',
          title: 'Morning Tennis Practice',
          description: 'Improve your tennis skills with experienced players.',
          sport: 'Tennis',
          organizer: { id: '2', username: 'tennis_pro' },
          location_name: 'City Tennis Club',
          event_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          duration_hours: 2,
          max_participants: 8,
          current_participants: 5,
          skill_level: 'intermediate',
          equipment_provided: false,
          cost: 15.00,
          tags: ['practice', 'coaching', 'indoor'],
          created_at: new Date().toISOString(),
          distance: 1200
        }
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      // Mock registration for now
      console.log('Registering for event:', eventId);
      // const response = await axios.post(`/events/${eventId}/register`);
      
      // Update local state
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? { ...event, current_participants: event.current_participants + 1 }
            : event
        )
      );
    } catch (error) {
      console.error('Failed to register for event:', error);
    }
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const eventDate = new Date(event.event_date);
    const timeDiff = eventDate - now;
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (timeDiff < 0) {
      return { status: 'past', label: 'Past Event', className: 'past' };
    } else if (daysDiff === 0) {
      return { status: 'today', label: 'Today', className: 'today' };
    } else if (daysDiff === 1) {
      return { status: 'tomorrow', label: 'Tomorrow', className: 'tomorrow' };
    } else if (daysDiff <= 7) {
      return { status: 'this-week', label: 'This Week', className: 'this-week' };
    } else {
      return { status: 'upcoming', label: 'Upcoming', className: 'upcoming' };
    }
  };

  const getAvailabilityStatus = (event) => {
    if (event.current_participants >= event.max_participants) {
      return { status: 'full', label: 'Full', className: 'full' };
    } else if (event.current_participants >= event.max_participants * 0.8) {
      return { status: 'filling', label: 'Filling Fast', className: 'filling' };
    } else {
      return { status: 'available', label: 'Available', className: 'available' };
    }
  };

  if (loading) {
    return (
      <div className="events">
        <div className="events__loading">
          <div className="loader"></div>
          <p>Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="events">
      <div className="events__header">
        <div className="events__title-section">
          <h1 className="events__title">Sports Events</h1>
          <p className="events__subtitle">Discover and join amazing sports events in your area</p>
        </div>
        <div className="events__header-actions">
          <button
            className="events__filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FaFilter />
            Filters
          </button>
          <Link to="/create-event" className="events__create-btn">
            <FaPlus />
            Create Event
          </Link>
        </div>
      </div>

      {showFilters && (
        <div className="events__filters">
          <div className="events__filter-row">
            <div className="events__filter-field">
              <label>Sport</label>
              <select
                value={filters.sport}
                onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
              >
                <option value="">All Sports</option>
                {sportOptions.map(sport => (
                  <option key={sport} value={sport}>{sport}</option>
                ))}
              </select>
            </div>

            <div className="events__filter-field">
              <label>Skill Level</label>
              <select
                value={filters.skillLevel}
                onChange={(e) => setFilters({ ...filters, skillLevel: e.target.value })}
              >
                {skillLevels.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
            </div>

            <div className="events__filter-field">
              <label>Date</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              />
            </div>

            <div className="events__filter-field">
              <label>Max Cost ($)</label>
              <input
                type="number"
                value={filters.maxCost}
                onChange={(e) => setFilters({ ...filters, maxCost: e.target.value })}
                placeholder="Any"
                min="0"
              />
            </div>
          </div>

          <div className="events__filter-row">
            <label className="events__filter-checkbox">
              <input
                type="checkbox"
                checked={filters.equipmentProvided}
                onChange={(e) => setFilters({ ...filters, equipmentProvided: e.target.checked })}
              />
              Equipment Provided
            </label>
          </div>
        </div>
      )}

      <div className="events__content">
        {events.length === 0 ? (
          <div className="events__empty">
            <FaCalendarAlt className="events__empty-icon" />
            <h3>No events found</h3>
            <p>No events match your current filters. Try adjusting your search criteria or create a new event!</p>
            <Link to="/create-event" className="events__empty-cta">
              <FaPlus />
              Create the First Event
            </Link>
          </div>
        ) : (
          <div className="events__grid">
            {events.map((event) => {
              const eventStatus = getEventStatus(event);
              const availabilityStatus = getAvailabilityStatus(event);
              
              return (
                <div key={event.id} className="events__card">
                  <div className="events__card-header">
                    <div className="events__card-badges">
                      <span className="events__sport-badge">{event.sport}</span>
                      <span className={`events__status events__status--${eventStatus.className}`}>
                        {eventStatus.label}
                      </span>
                      <span className={`events__availability events__availability--${availabilityStatus.className}`}>
                        {availabilityStatus.label}
                      </span>
                    </div>
                    <div className="events__organizer">
                      <Link 
                        to={`/profile/${event.organizer?.id}`}
                        className="events__organizer-link"
                      >
                        <div className="events__organizer-avatar">
                          <FaUser />
                        </div>
                        <span className="events__organizer-name">
                          {event.organizer?.username || 'Unknown'}
                        </span>
                      </Link>
                    </div>
                  </div>

                  <div className="events__card-content">
                    <h3 className="events__card-title">{event.title}</h3>
                    <p className="events__card-description">{event.description}</p>

                    {event.tags && event.tags.length > 0 && (
                      <div className="events__tags">
                        <FaTags className="events__tags-icon" />
                        {event.tags.map((tag, index) => (
                          <span key={index} className="events__tag">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="events__card-details">
                    <div className="events__detail">
                      <FaMapMarkerAlt className="events__detail-icon" />
                      <span className="events__location-name">{event.location_name}</span>
                      {event.distance && (
                        <span className="events__distance">
                          ({(event.distance / 1000).toFixed(1)}km away)
                        </span>
                      )}
                    </div>

                    <div className="events__detail">
                      <FaCalendarAlt className="events__detail-icon" />
                      <span>{formatDateTime(event.event_date)}</span>
                    </div>

                    <div className="events__detail">
                      <FaClock className="events__detail-icon" />
                      <span>{event.duration_hours} hour{event.duration_hours > 1 ? 's' : ''}</span>
                    </div>

                    <div className="events__detail">
                      <FaUsers className="events__detail-icon" />
                      <span>{event.current_participants}/{event.max_participants} participants</span>
                    </div>

                    {event.cost > 0 && (
                      <div className="events__detail">
                        <FaDollarSign className="events__detail-icon" />
                        <span>${event.cost}</span>
                      </div>
                    )}

                    {event.equipment_provided && (
                      <div className="events__detail events__detail--highlight">
                        <FaCheckCircle className="events__detail-icon" />
                        <span>Equipment Provided</span>
                      </div>
                    )}
                  </div>

                  <div className="events__card-footer">
                    <div className="events__stats">
                      <div className="events__skill-level">
                        Skill Level: <span>{event.skill_level}</span>
                      </div>
                      <div className="events__created">
                        Posted {formatRelativeTime(event.created_at)}
                      </div>
                    </div>

                    <button
                      className={`events__register-btn ${
                        event.current_participants >= event.max_participants 
                          ? 'events__register-btn--full' 
                          : ''
                      }`}
                      onClick={() => handleRegister(event.id)}
                      disabled={event.current_participants >= event.max_participants}
                    >
                      {event.current_participants >= event.max_participants ? (
                        <>
                          <FaTimes />
                          Full
                        </>
                      ) : (
                        <>
                          <FaCheckCircle />
                          Register
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;