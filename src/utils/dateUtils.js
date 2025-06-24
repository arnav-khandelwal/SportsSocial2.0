// Date utility functions for consistent formatting
export const formatDate = (dateString) => {
  if (!dateString) return 'Unknown time';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'  // Use UTC to preserve the original time
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'Unknown time';
  
  try {
    // Parse date string but preserve original timezone intent
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid date';
    }
    
    // Use UTC methods to prevent timezone conversion
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'  // Use UTC to preserve the original time
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid date';
  }
};

export const formatTime = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid time';
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC'  // Use UTC to preserve the original time
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};

// Helper to correct timezone issues when calculating date differences
const getDateObjectFromString = (dateString) => {
  try {
    const parts = dateString.split(/[^0-9]/); // Split on non-numeric characters
    // Create date using UTC time constructor to avoid timezone shifts
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
    const day = parseInt(parts[2], 10);
    const hour = parseInt(parts[3], 10);
    const minute = parseInt(parts[4], 10);
    const second = parseInt(parts[5], 10);
    
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  } catch (e) {
    console.warn('Error parsing date:', e);
    return new Date(dateString); // Fallback
  }
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Unknown time';
  
  try {
    // Parse the date string properly preserving the original time
    const date = getDateObjectFromString(dateString);
    
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid date';
    }
    
    const now = new Date();
    // Get UTC timestamps to compare apples-to-apples
    const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 
                            now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    const utcDate = date.getTime();
    
    const diffInSeconds = Math.floor((utcNow - utcDate) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateString);
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Invalid date';
  }
};