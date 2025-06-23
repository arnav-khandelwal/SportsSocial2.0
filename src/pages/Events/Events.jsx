import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaUsers, 
  FaHeart, 
  FaTags, 
  FaPlus,
  FaFilter,
  FaClock,
  FaUser,
  FaSearch
} from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';
import PostFilters from '../../components/PostFilters/PostFilters';
import './Events.scss';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: '',
    tags: [],
    date: '',
    location: null,
    radius: -1
  });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        sport: filters.sport,
        tags: filters.tags,
        date: filters.date,
        radius: filters.radius
      };

      if (filters.location && filters.radius !== -1) {
        params.lat = filters.location.coordinates[1];
        params.lng = filters.location.coordinates[0];
      }

      const response = await axios.get('/posts', { params });
      
      // Filter out user's own posts and sort by event time
      const filteredEvents = response.data
        .filter(event => event.author_id !== user?.id)
        .sort((a, b) => new Date(a.event_time) - new Date(b.event_time));

      setEvents(filteredEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleInterest = async (eventId) => {
    try {
      const response = await axios.post(`/posts/${eventId}/interest`);
      
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === eventId
            ? {
                ...event,
                interested_users: [...(event.interested_users || [])]
              }
            : event
        )
      );

      setTimeout(() => {
        fetchEvents();
      }, 500);

      return response.data;
    } catch (error) {
      console.error('Failed to show interest:', error);
      throw error;
    }
  };

  const getEventStatus = (eventTime) => {
    const now = new Date();
    const eventDate = new Date(eventTime);
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

  const isUserInterested = (event) => {
    return event.interested_users?.some(interest => interest.user_id === user?.id);
  };

  const getSubtitle = () => {
    if (filters.location && filters.radius !== -1) {
      const distance =
        filters.radius === 100000
          ? '100km'
          : filters.radius === 50000
          ? '50km'
          : filters.radius === 25000
          ? '25km'
          : filters.radius === 10000
          ? '10km'
          : filters.radius === 5000
          ? '5km'
          : '1km';
      return `Showing events within ${distance} of ${filters.location.name}`;
    }
    return 'Discover amazing sports events happening around you';
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
          <p className="events__subtitle">{getSubtitle()}</p>
        </div>
        <div className="events__header-actions">
          <div className="events__view-toggle">
            <button
              className={`events__view-btn ${viewMode === 'grid' ? 'events__view-btn--active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="1"/>
                <rect x="9" y="1" width="6" height="6" rx="1"/>
                <rect x="1" y="9" width="6" height="6" rx="1"/>
                <rect x="9" y="9" width="6" height="6" rx="1"/>
              </svg>
            </button>
            <button
              className={`events__view-btn ${viewMode === 'list' ? 'events__view-btn--active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="2" width="14" height="2" rx="1"/>
                <rect x="1" y="7" width="14" height="2" rx="1"/>
                <rect x="1" y="12" width="14" height="2" rx="1"/>
              </svg>
            </button>
          </div>
          <Link to="/create-post" className="events__create-btn">
            <FaPlus />
            Create Event
          </Link>
        </div>
      </div>

      <div className="events__content">
        <div className="events__main">
          {events.length === 0 ? (
            <div className="events__empty">
              <FaCalendarAlt className="events__empty-icon" />
              <h3>No events found</h3>
              <p>
                {filters.location
                  ? `No events found near ${filters.location.name}. Try expanding your search radius or clearing location filters.`
                  : 'No events match your current filters. Try adjusting your search criteria or create a new event!'}
              </p>
              <Link to="/create-post" className="events__empty-cta">
                <FaPlus />
                Create the First Event
              </Link>
            </div>
          ) : (
            <div className={`events__grid events__grid--${viewMode}`}>
              {events.map((event) => {
                const eventStatus = getEventStatus(event.event_time);
                const userInterested = isUserInterested(event);
                
                return (
                  <div key={event.id} className="events__card">
                    <div className="events__card-header">
                      <div className="events__card-meta">
                        <span className="events__sport-badge">{event.sport}</span>
                        <span className={`events__status events__status--${eventStatus.className}`}>
                          {eventStatus.label}
                        </span>
                      </div>
                      <div className="events__author">
                        <Link 
                          to={`/profile/${event.author?.id || event.author_id}`}
                          className="events__author-link"
                        >
                          <div className="events__author-avatar">
                            <FaUser />
                          </div>
                          <span className="events__author-name">
                            {event.author?.username || 'Unknown User'}
                          </span>
                        </Link>
                      </div>
                    </div>

                    <div className="events__card-content">
                      <h3 className="events__card-title">{event.heading}</h3>
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
                        <FaClock className="events__detail-icon" />
                        <span>{formatDateTime(event.event_time)}</span>
                      </div>

                      <div className="events__detail">
                        <FaUsers className="events__detail-icon" />
                        <span>{event.players_needed} players needed</span>
                      </div>
                    </div>

                    <div className="events__card-footer">
                      <div className="events__stats">
                        <div className="events__stat">
                          <FaHeart className="events__stat-icon" />
                          <span>{(event.interested_users || []).length} interested</span>
                        </div>
                        <div className="events__created">
                          Posted {formatRelativeTime(event.created_at)}
                        </div>
                      </div>

                      <button
                        className={`events__interest-btn ${userInterested ? 'events__interest-btn--interested' : ''}`}
                        onClick={() => handleInterest(event.id)}
                        disabled={userInterested}
                      >
                        {userInterested ? 'Interested' : 'I\'m Interested'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="events__sidebar">
          <PostFilters filters={filters} onFilterChange={handleFilterChange} />
          
          <div className="events__stats-card">
            <h3>Event Statistics</h3>
            <div className="events__stats-grid">
              <div className="events__stat-item">
                <span className="events__stat-number">{events.length}</span>
                <span className="events__stat-label">Total Events</span>
              </div>
              <div className="events__stat-item">
                <span className="events__stat-number">
                  {events.filter(e => getEventStatus(e.event_time).status === 'today').length}
                </span>
                <span className="events__stat-label">Today</span>
              </div>
              <div className="events__stat-item">
                <span className="events__stat-number">
                  {events.filter(e => getEventStatus(e.event_time).status === 'this-week').length}
                </span>
                <span className="events__stat-label">This Week</span>
              </div>
              <div className="events__stat-item">
                <span className="events__stat-number">
                  {[...new Set(events.map(e => e.sport))].length}
                </span>
                <span className="events__stat-label">Sports</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;