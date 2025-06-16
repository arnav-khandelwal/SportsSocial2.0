import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import PostCard from '../../components/PostCard/PostCard';
import PostFilters from '../../components/PostFilters/PostFilters';
import './Home.scss';

const Home = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sport: '',
    tags: [],
    date: '',
    location: null,
    radius: -1 // -1 means no location filter
  });

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = {
        sport: filters.sport,
        tags: filters.tags,
        date: filters.date,
        radius: filters.radius
      };

      // Only add location params if location is set and radius is not -1
      if (filters.location && filters.radius !== -1) {
        params.lat = filters.location.coordinates[1]; // latitude
        params.lng = filters.location.coordinates[0]; // longitude
      }

      const response = await axios.get('/posts', { params });
      
      // Filter out the current user's own posts
      const filteredPosts = response.data.filter(post => 
        post.author_id !== user?.id
      );
      
      setPosts(filteredPosts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleInterest = async (postId) => {
    try {
      const response = await axios.post(`/posts/${postId}/interest`);
      
      // Update the specific post in the state instead of refetching all posts
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            // Add the current user to the interested_users array
            const updatedInterestedUsers = [...(post.interested_users || [])];
            // Note: We don't have the full user object here, but the PostCard component
            // will handle the state correctly based on the response
            return {
              ...post,
              interested_users: updatedInterestedUsers
            };
          }
          return post;
        })
      );

      // Optionally refresh posts to get the most up-to-date data
      // This ensures we have the correct interested_users data
      setTimeout(() => {
        fetchPosts();
      }, 500);

      return response.data;
    } catch (error) {
      console.error('Failed to show interest:', error);
      throw error;
    }
  };

  const getSubtitle = () => {
    if (filters.location && filters.radius !== -1) {
      const distance = filters.radius === 100000 ? '100km' : 
                     filters.radius === 50000 ? '50km' :
                     filters.radius === 25000 ? '25km' :
                     filters.radius === 10000 ? '10km' :
                     filters.radius === 5000 ? '5km' : '1km';
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

      <PostFilters filters={filters} onFilterChange={handleFilterChange} />

      <div className="home__posts">
        {posts.length === 0 ? (
          <div className="home__empty">
            <h3>No posts found</h3>
            <p>
              {filters.location 
                ? `No events found near ${filters.location.name}. Try expanding your search radius or clearing location filters.`
                : 'No posts from other users match your current filters. Try adjusting your search criteria or create a new post!'
              }
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
    </div>
  );
};

export default Home;