import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaTags } from 'react-icons/fa';
import axios from 'axios';
import './CreateReview.scss';

const CreateReview = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    rating: 0,
    category: 'general',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const categoryOptions = [
    { value: 'general', label: 'General Experience' },
    { value: 'venue', label: 'Sports Venue' },
    { value: 'event', label: 'Sports Event' },
    { value: 'equipment', label: 'Sports Equipment' },
    { value: 'coaching', label: 'Coaching/Training' },
    { value: 'app', label: 'App Experience' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRatingClick = (rating) => {
    setFormData({
      ...formData,
      rating
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.rating === 0) {
      setError('Please select a rating');
      setLoading(false);
      return;
    }

    try {
      const reviewData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await axios.post('/reviews', reviewData);
      navigate('/reviews');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <button
        key={index}
        type="button"
        className={`create-review__star ${index < formData.rating ? 'create-review__star--filled' : ''}`}
        onClick={() => handleRatingClick(index + 1)}
      >
        <FaStar />
      </button>
    ));
  };

  return (
    <div className="create-review">
      <div className="create-review__container">
        <div className="create-review__header">
          <h1 className="create-review__title">Write a Review</h1>
          <p className="create-review__subtitle">Share your sports experience with the community</p>
        </div>

        <form className="create-review__form" onSubmit={handleSubmit}>
          {error && <div className="create-review__error">{error}</div>}

          <div className="create-review__field">
            <label>Category *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="create-review__field">
            <label>Rating *</label>
            <div className="create-review__rating">
              {renderStars()}
              <span className="create-review__rating-text">
                {formData.rating > 0 ? `${formData.rating} star${formData.rating > 1 ? 's' : ''}` : 'Click to rate'}
              </span>
            </div>
          </div>

          <div className="create-review__field">
            <label>Review Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Great basketball court with excellent facilities"
              required
              maxLength="100"
            />
          </div>

          <div className="create-review__field">
            <label>Your Review *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Share your detailed experience, what you liked, what could be improved, etc."
              required
              rows="6"
              maxLength="2000"
            />
            <div className="create-review__char-count">
              {formData.content.length}/2000 characters
            </div>
          </div>

          <div className="create-review__field">
            <label>Tags (Optional)</label>
            <div className="create-review__input-with-icon">
              <FaTags className="create-review__input-icon" />
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., indoor, beginner-friendly, parking (comma separated)"
              />
            </div>
            <div className="create-review__help-text">
              Add relevant tags to help others find your review
            </div>
          </div>

          <div className="create-review__actions">
            <button
              type="button"
              className="create-review__cancel"
              onClick={() => navigate('/reviews')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-review__submit"
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Publish Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateReview;