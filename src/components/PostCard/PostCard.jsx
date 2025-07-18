import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaMapMarkerAlt, FaClock, FaUsers, FaHeart, FaTags, FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime, formatDateTime } from '../../utils/dateUtils';
import axios from 'axios';
import './PostCard.scss';
import valorantIcon from '../../assets/icons/valorant.png';
import bgmiIcon from '../../assets/icons/bgmi.png';
import eafcIcon from '../../assets/icons/EAFC.png';
import nba2kIcon from '../../assets/icons/NBA2K.png';
import leagueOfLegendsIcon from '../../assets/icons/leagueoflegends.png';
import callOfDutyIcon from '../../assets/icons/CallOfDuty.png';
import minecraftIcon from '../../assets/icons/minecraft.png';
import apexLegendsIcon from '../../assets/icons/apexlegends.png';

const SPORTS = [
  'Football', 'Basketball', 'Tennis', 'Soccer', 'Baseball', 'Volleyball',
  'Swimming', 'Running', 'Cycling', 'Golf', 'Hockey', 'Cricket', 'Rugby',
  'Badminton', 'Table Tennis'
];
const ONLINE_GAMES = [
  'Valorant', 'BGMI', 'EAFC', 'NBA 2K', 'League of Legends',
  'Call of Duty', 'Minecraft', 'Apex Legends', 'Other Online Games'
];

const getSportIcon = (sport) => {
  const onlineGameIcons = {
    'Valorant': valorantIcon,
    'BGMI': bgmiIcon,
    'EAFC': eafcIcon,
    'NBA 2K': nba2kIcon,
    'League of Legends': leagueOfLegendsIcon,
    'Call of Duty': callOfDutyIcon,
    'Minecraft': minecraftIcon,
    'Apex Legends': apexLegendsIcon,
  };
  if (ONLINE_GAMES.includes(sport)) {
    if (onlineGameIcons[sport]) {
      return { type: 'esport', icon: onlineGameIcons[sport], useImage: true };
    }
    return { type: 'esport', icon: '🎮', useImage: false };
  }
  // Default to emoji for sports
  const sportIcons = {
    'Football': '⚽',
    'Basketball': '🏀',
    'Tennis': '🎾',
    'Soccer': '⚽',
    'Baseball': '⚾',
    'Volleyball': '🏐',
    'Swimming': '🏊‍♂️',
    'Running': '🏃‍♂️',
    'Cycling': '🚴‍♂️',
    'Golf': '⛳',
    'Hockey': '🏒',
    'Cricket': '🏏',
    'Rugby': '🏉',
    'Badminton': '🏸',
    'Table Tennis': '🏓',
    'Other': '🎲',
  };
  return { type: 'sport', icon: sportIcons[sport] || '�', useImage: false };
};

const PostCard = ({ post, onInterest }) => {
  const { user } = useAuth();
  const [isInterested, setIsInterested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(null);

  useEffect(() => {
    // Check if current user has already shown interest in this post
    if (post.interested_users && user) {
      const userHasInterest = post.interested_users.some(
        interest => interest.user_id === user.id
      );
      setIsInterested(userHasInterest);
    }
  }, [post.interested_users, user]);

  useEffect(() => {
    const fetchAuthorProfile = async () => {
      try {
        const response = await axios.get(`/settings/public/${post.author?.id || post.author_id}`);
        setAuthorProfile({ profile_picture: response.data.profile_picture_url });
      } catch (error) {
        console.error('Failed to fetch author profile:', error);
      }
    };

    if (post.author?.id || post.author_id) {
      fetchAuthorProfile();
    }
  }, [post.author?.id, post.author_id]);

  const handleInterest = async () => {
    if (isInterested || loading) return;
    
    setLoading(true);
    try {
      await onInterest(post.id);
      setIsInterested(true);
    } catch (error) {
      console.error('Failed to show interest:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post-card">
      <div className="post-card__header">
        <div className="post-card__author">
          <Link 
            to={`/profile/${post.author?.id || post.author_id}`}
            className="post-card__avatar-link"
          >
            <div className="post-card__avatar">
              {authorProfile?.profile_picture ? (
                <img src={authorProfile.profile_picture} alt="Author" className='post-card__avatar__image' />
              ) : (
                <FaUser />
              )}
            </div>
          </Link>
          <div className="post-card__author-info">
            <Link 
              to={`/profile/${post.author?.id || post.author_id}`}
              className="post-card__author-link"
            >
              <h4 className="post-card__author-name">{post.author?.username || 'Unknown User'}</h4>
            </Link>
            <span className="post-card__time">{formatRelativeTime(post.created_at || post.createdAt)}</span>
          </div>
        </div>
        <div className={`post-card__sport-badge post-card__sport-badge--${getSportIcon(post.sport).type}`}>
          {getSportIcon(post.sport).useImage ? (
            <img src={getSportIcon(post.sport).icon} alt={post.sport} style={{ height: 20, width: 20, verticalAlign: 'middle', marginRight: 6 }} />
          ) : (
            <span style={{ marginRight: 6 }}>{getSportIcon(post.sport).icon}</span>
          )}
          {post.sport}
        </div>
      </div>

      <div className="post-card__content">
        <h3 className="post-card__title">{post.heading}</h3>
        <p className="post-card__description">{post.description}</p>

        {post.tags && post.tags.length > 0 && (
          <div className="post-card__tags">
            <FaTags className="post-card__tags-icon" />
            {post.tags.map((tag, index) => (
              <span key={index} className="post-card__tag">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="post-card__details">
        <div className="post-card__detail">
          <FaMapMarkerAlt className="post-card__detail-icon" />
          <span className="post-card__location-name">{post.location_name || post.locationName}</span>
          {post.distance && (
            <span className="post-card__distance">
              ({(post.distance / 1000).toFixed(1)}km away)
            </span>
          )}
        </div>

        <div className="post-card__detail">
          <FaClock className="post-card__detail-icon" />
          <span>{formatDateTime(post.event_time || post.eventTime)}</span>
        </div>

        <div className="post-card__detail">
          <FaUsers className="post-card__detail-icon" />
          <span>{post.players_needed || post.playersNeeded} players needed</span>
        </div>
      </div>

      <div className="post-card__footer">
        <div className="post-card__interested">
          <FaHeart className="post-card__heart" />
          <span>{(post.interested_users || post.interestedUsers || []).length} interested</span>
        </div>

        <button
          className={`post-card__interest-btn ${isInterested ? 'post-card__interest-btn--interested' : ''}`}
          onClick={handleInterest}
          disabled={isInterested || loading}
        >
          {loading ? 'Processing...' : isInterested ? 'Interested' : 'I\'m Interested'}
        </button>
      </div>
    </div>
  );
};

export default PostCard;