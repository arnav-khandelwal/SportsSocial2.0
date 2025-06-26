import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import PostCard from '../../components/PostCard/PostCard';
import PostFilters from '../../components/PostFilters/PostFilters';
import './Home.scss';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
};

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sports: [],
    esports: [],
    filterType: 'ALL',
    tags: [],
    date: '',
    location: null,
    radius: -1
  });

  const isMobile = useIsMobile();

  // Debounce filter changes
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPosts();
    }, 300);
    return () => clearTimeout(handler);
  }, [filters]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = { ...filters };
      if (filters.location && filters.radius !== -1) {
        params.lat = filters.location.coordinates[1];
        params.lng = filters.location.coordinates[0];
      }
      const response = await axios.get('/posts', { params });
      const filteredPosts = response.data.filter(
        (post) => post.author_id !== user?.id
      );
      setPosts(filteredPosts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters({
      ...filters,
      ...newFilters
    });
  };

  const handleInterest = async (postId) => {
    try {
      // Find the post in our local state to get its details
      const post = posts.find(p => p.id === postId);
      if (!post) {
        throw new Error('Post not found');
      }

      // Register interest in the post
      const response = await axios.post(`/posts/${postId}/interest`);
      
      if (!response.data || !response.data.groupChatId) {
        throw new Error('No group chat ID returned from server');
      }

      // Update local state to reflect interest
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                interested_users: [...(p.interested_users || []), { user_id: user.id }]
              }
            : p
        )
      );
      
      // Refresh posts in the background
      setTimeout(() => {
        fetchPosts();
      }, 500);

      // Navigate to messages page with the group chat open
      navigate('/messages', {
        replace: true, // Use replace to prevent going back to this state
        state: {
          startConversation: null, // Ensure no direct message is started
          activeChat: {
            id: response.data.groupChatId,
            type: 'group',
            name: `${post.sport} - ${post.heading}`
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to show interest:', error);
      throw error;
    }
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
    return 'Discover sports activities from other users';
  };

  if (loading) {
    return (
      <div className="home">
        <div className="home__loading">
          <div className="loader"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="home__header">
        <h1 className="home__title">Sports Feed</h1>
        <p className="home__subtitle">{getSubtitle()}</p>
      </div>

      {/* PostFilters at top for mobile, at right for desktop */}
      {isMobile && (
        <div className="home__filters home__filters--mobile">
          <PostFilters filters={filters} onFilterChange={handleFilterChange} is_open={false} />
        </div>
      )}

      <div className="home__content">
        {/* Posts */}
        <div className="home__posts">
          {posts.length === 0 ? (
            <div className="home__empty">
              <h3>No posts found</h3>
              <p>
                {filters.location
                  ? `No events found near ${filters.location.name}. Try expanding your search radius or clearing location filters.`
                  : 'No posts from other users match your current filters. Try adjusting your search criteria or create a new post!'}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onInterest={handleInterest}
              />
            ))
          )}
        </div>

        {/* PostFilters at right for desktop/tablet */}
        {!isMobile && (
          <div className="home__filters home__filters--desktop">
            <PostFilters filters={filters} onFilterChange={handleFilterChange} is_open={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;