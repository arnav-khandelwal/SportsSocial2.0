import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  FaTimes,
  FaTrophy
} from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';
import './Events.scss';

// Import game icons
import valorantIcon from '../../assets/icons/valorant.png';
import rocketLeagueIcon from '../../assets/icons/rocketleague.png';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

const Events = () => {
  const navigate = useNavigate();
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
  const isMobile = useIsMobile();
  const [showFilters, setShowFilters] = useState(false);

  const sportOptions = [
    'Football', 'Basketball', 'Tennis', 'Soccer', 'Baseball', 
    'Volleyball', 'Swimming', 'Running', 'Cycling', 'Golf',
    'Hockey', 'Cricket', 'Rugby', 'Badminton', 'Table Tennis',
    'Valorant', 'Rocket League'
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

  useEffect(() => {
    setShowFilters(false);
  }, [isMobile]);

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
      
      // Mock data for the three specified events
      const mockEvents = [
        {
          id: '1',
          title: '5v5 Valorant Tournament',
          description: 'Compete in a 5v5 Valorant tournament! Online event open for all teams. Registration is free. Prize pool: ₹1500 for the winning team.',
          sport: 'Valorant',
          organizer: { id: 'admin', username: 'admin' },
          location_name: 'Online',
          event_date: '2025-07-04T12:00:00.000Z', // July 4th start
          end_date: '2025-07-05T23:59:59.000Z', // July 6th end
          duration_hours: 72, // 3 days (Jul 4-6)
          max_participants: null,
          current_participants: 0,
          skill_level: 'all',
          equipment_provided: false,
          cost: 0,
          tags: ['online', 'esports', 'valorant', '5v5'],
          created_at: new Date().toISOString(),
          distance: null,
          prize: '₹1500 prize pool'
        },
        {
          id: '2',
          title: '3v3 Rocket League Tournament',
          description: 'Join our 3v3 Rocket League online tournament! Free to register. Show your skills and teamwork to win an exciting prize pool of ₹1500.',
          sport: 'Rocket League',
          organizer: { id: 'admin', username: 'admin' },
          location_name: 'Online',
          event_date: '2025-07-04T14:00:00.000Z', // July 4th start
          end_date: '2025-07-05T23:59:59.000Z', // July 6th end
          duration_hours: 72, // 3 days (Jul 4-6)
          max_participants: null,
          current_participants: 0,
          skill_level: 'all',
          equipment_provided: false,
          cost: 0,
          tags: ['online', 'esports', 'rocketleague', '3v3'],
          created_at: new Date().toISOString(),
          distance: null,
          prize: '₹1500 prize pool'
        },
        {
          id: '3',
          title: "3v3 Basketball Tournament at Lion's Club",
          description: "Join our 3v3 basketball tournament at Lion's Club, Indirapuram! Team registration fee is ₹100. Compete for a prize pool of ₹1500.",
          sport: 'Basketball',
          organizer: { id: 'admin', username: 'admin' },
          location_name: "Lion's Club, 28°37'32.3\"N 77°25'43.2\"E, Indirapuram, Ghaziabad, Uttar Pradesh 201014",
          event_date: '2025-07-06T16:00:00+05:30', // July 8th 4pm IST
          end_date: '2025-07-06T19:00:00+05:30', // July 7th 7pm IST
          duration_hours: 3, // 4-7 PM
          max_participants: null,
          current_participants: 0,
          skill_level: 'all',
          equipment_provided: true,
          cost: 100,
          tags: ['basketball', 'offline', 'sports', '3v3'],
          created_at: new Date().toISOString(),
          distance: null,
          prize: '₹1500 prize pool'
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

  const handleRegister = (event) => {
    navigate('/events/register', { 
      state: { 
        eventTitle: event.title,
        eventId: event.id
      }
    });
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
              <label>Max Cost (₹)</label>
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
              
              return (
                <div key={event.id} className="events__card">
                  <div className="events__card-header">
                    <div className="events__card-badges">
                      <span className="events__sport-badge events__sport-badge--custom">
                        {event.sport === 'Valorant' && (
                          <img src={valorantIcon} alt="Valorant" className="events__sport-icon" />
                        )}
                        {event.sport === 'Rocket League' && (
                          <img src={rocketLeagueIcon} alt="Rocket League" className="events__sport-icon" />
                        )}
                        {event.sport === 'Basketball' && (
                          <span role="img" aria-label="Basketball" style={{fontSize: '20px', marginRight: '6px'}}>🏀</span>
                        )}
                        {event.sport}
                      </span>
                      <span className={`events__status events__status--${eventStatus.className}`}>
                        {eventStatus.label}
                      </span>
                      
                      <span className="events__prize-badge">
                        <FaTrophy />
                        Prize: {event.prize}
                      </span>
                    </div>
                    <div className="events__organizer">
                      <Link 
                        to="/about"
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
                      {event.sport === 'Basketball' ? (
                        <span>6th July, 4pm to 7pm</span>
                      ) : event.end_date && event.end_date !== event.event_date ? (
                        <span>
                          {new Date(event.event_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })} - {new Date(event.end_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      ) : (
                        <span>{formatDateTime(event.event_date)}</span>
                      )}
                    </div>

                    <div className="events__detail">
                      <FaClock className="events__detail-icon" />
                      <span>{event.duration_hours} hour{event.duration_hours > 1 ? 's' : ''}</span>
                    </div>

                    <div className="events__detail">
                      <FaUsers className="events__detail-icon" />
                      <span>Open participation</span>
                    </div>

                    {event.cost > 0 && (
                      <div className="events__detail">
                        <FaDollarSign className="events__detail-icon" />
                        <span>₹{event.cost} (At the venue)</span>
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
                      className="events__register-btn"
                      onClick={() => handleRegister(event)}
                    >
                      <FaCheckCircle />
                      Register
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