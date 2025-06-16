/*
  # Notification System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key) - recipient of notification
      - `type` (text) - follow, interest, nearby_post, message
      - `title` (text) - notification title
      - `message` (text) - notification content
      - `data` (jsonb) - additional data (post_id, user_id, etc.)
      - `is_read` (boolean) - read status
      - `created_at` (timestamp)
    
    - `user_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `notification_follows` (boolean) - receive follow notifications
      - `notification_interests` (boolean) - receive interest notifications
      - `notification_nearby_posts` (boolean) - receive nearby post notifications
      - `notification_messages` (boolean) - receive message notifications
      - `location` (geography point) - user's location for nearby notifications
      - `location_name` (text) - user's location name
      - `nearby_radius` (integer) - radius in meters for nearby notifications
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own notifications and preferences

  3. Functions
    - Function to create notifications
    - Function to check for nearby posts
    - Triggers for automatic notification creation
*/

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('follow', 'interest', 'nearby_post', 'message')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_follows boolean DEFAULT true,
  notification_interests boolean DEFAULT true,
  notification_nearby_posts boolean DEFAULT true,
  notification_messages boolean DEFAULT true,
  location geography(POINT, 4326),
  location_name text,
  nearby_radius integer DEFAULT 25000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_user_preferences_location ON user_preferences USING GIST (location);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications table
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for user_preferences table
CREATE POLICY "Users can read own preferences" ON user_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  recipient_id uuid,
  notification_type text,
  notification_title text,
  notification_message text,
  notification_data jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  notification_id uuid;
  user_prefs record;
BEGIN
  -- Get user preferences
  SELECT * INTO user_prefs FROM user_preferences WHERE user_id = recipient_id;
  
  -- Check if user wants this type of notification
  IF user_prefs IS NULL OR (
    (notification_type = 'follow' AND user_prefs.notification_follows) OR
    (notification_type = 'interest' AND user_prefs.notification_interests) OR
    (notification_type = 'nearby_post' AND user_prefs.notification_nearby_posts) OR
    (notification_type = 'message' AND user_prefs.notification_messages)
  ) THEN
    -- Create the notification
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (recipient_id, notification_type, notification_title, notification_message, notification_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Function to check for users who should receive nearby post notifications
CREATE OR REPLACE FUNCTION notify_nearby_users_for_post(post_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  post_record record;
  user_record record;
  notification_id uuid;
BEGIN
  -- Get the post details
  SELECT p.*, u.username as author_name 
  INTO post_record 
  FROM posts p 
  JOIN users u ON u.id = p.author_id 
  WHERE p.id = post_id;
  
  -- Find users who should be notified
  FOR user_record IN
    SELECT DISTINCT up.user_id, u.username, up.nearby_radius
    FROM user_preferences up
    JOIN users u ON u.id = up.user_id
    WHERE up.notification_nearby_posts = true
      AND up.location IS NOT NULL
      AND up.user_id != post_record.author_id
      AND ST_DWithin(up.location, post_record.location, up.nearby_radius)
      AND u.id IN (
        SELECT user_id FROM unnest(u.sports) as user_sport
        WHERE user_sport = post_record.sport
      )
  LOOP
    -- Create notification for each nearby user interested in this sport
    SELECT create_notification(
      user_record.user_id,
      'nearby_post',
      'New ' || post_record.sport || ' activity nearby!',
      post_record.author_name || ' posted "' || post_record.heading || '" near your location.',
      jsonb_build_object(
        'post_id', post_record.id,
        'author_id', post_record.author_id,
        'sport', post_record.sport,
        'location_name', post_record.location_name
      )
    ) INTO notification_id;
  END LOOP;
END;
$$;

-- Trigger function for follow notifications
CREATE OR REPLACE FUNCTION notify_user_followed()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  follower_name text;
  notification_id uuid;
BEGIN
  -- Get follower's username
  SELECT username INTO follower_name FROM users WHERE id = NEW.follower_id;
  
  -- Create notification
  SELECT create_notification(
    NEW.following_id,
    'follow',
    'New follower!',
    follower_name || ' started following you.',
    jsonb_build_object('follower_id', NEW.follower_id)
  ) INTO notification_id;
  
  RETURN NEW;
END;
$$;

-- Trigger function for interest notifications
CREATE OR REPLACE FUNCTION notify_post_interest()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  interested_user_name text;
  post_record record;
  notification_id uuid;
BEGIN
  -- Get interested user's username and post details
  SELECT u.username INTO interested_user_name FROM users u WHERE u.id = NEW.user_id;
  SELECT p.*, u.username as author_name 
  INTO post_record 
  FROM posts p 
  JOIN users u ON u.id = p.author_id 
  WHERE p.id = NEW.post_id;
  
  -- Don't notify if user is interested in their own post
  IF post_record.author_id != NEW.user_id THEN
    -- Create notification for post author
    SELECT create_notification(
      post_record.author_id,
      'interest',
      'Someone is interested in your post!',
      interested_user_name || ' is interested in "' || post_record.heading || '".',
      jsonb_build_object(
        'post_id', NEW.post_id,
        'interested_user_id', NEW.user_id
      )
    ) INTO notification_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger function for nearby post notifications
CREATE OR REPLACE FUNCTION notify_nearby_post()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Call the function to notify nearby users
  PERFORM notify_nearby_users_for_post(NEW.id);
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_user_followed ON user_followers;
CREATE TRIGGER trigger_notify_user_followed
  AFTER INSERT ON user_followers
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_followed();

DROP TRIGGER IF EXISTS trigger_notify_post_interest ON post_interests;
CREATE TRIGGER trigger_notify_post_interest
  AFTER INSERT ON post_interests
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_interest();

DROP TRIGGER IF EXISTS trigger_notify_nearby_post ON posts;
CREATE TRIGGER trigger_notify_nearby_post
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION notify_nearby_post();

-- Function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(user_id uuid, limit_count integer DEFAULT 20)
RETURNS TABLE(
  id uuid,
  type text,
  title text,
  message text,
  data jsonb,
  is_read boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT n.id, n.type, n.title, n.message, n.data, n.is_read, n.created_at
  FROM notifications n
  WHERE n.user_id = user_id
  ORDER BY n.created_at DESC
  LIMIT limit_count;
$$;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(user_id uuid, notification_ids uuid[] DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count integer;
BEGIN
  IF notification_ids IS NULL THEN
    -- Mark all notifications as read
    UPDATE notifications 
    SET is_read = true 
    WHERE user_id = mark_notifications_as_read.user_id AND is_read = false;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications 
    SET is_read = true 
    WHERE user_id = mark_notifications_as_read.user_id 
      AND id = ANY(notification_ids) 
      AND is_read = false;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  END IF;
  
  RETURN updated_count;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)
  FROM notifications
  WHERE user_id = get_unread_notification_count.user_id AND is_read = false;
$$;