/*
  # Settings System Enhancement

  1. New Tables
    - `user_settings`
      - Profile management settings
      - Security settings
      - Notification preferences
      - Privacy settings
    
    - `user_skills`
      - Sport-specific skill levels
    
    - `user_availability`
      - Weekly availability schedule
    
    - `user_profile_media`
      - Profile pictures and cover photos

  2. Security
    - Enable RLS on all tables
    - Add policies for users to manage their own settings

  3. Functions
    - Functions to manage user settings
    - Functions to handle profile media
*/

-- User settings table (comprehensive settings)
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Profile settings
  profile_picture_url text,
  cover_photo_url text,
  location_city text,
  activity_radius integer DEFAULT 25000,
  phone_number text,
  phone_verified boolean DEFAULT false,
  
  -- Privacy settings
  profile_visibility text DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends_only')),
  location_sharing text DEFAULT 'general' CHECK (location_sharing IN ('exact', 'general', 'hidden')),
  show_online_status boolean DEFAULT true,
  activity_history_visibility text DEFAULT 'public' CHECK (activity_history_visibility IN ('public', 'friends_only', 'private')),
  phone_visibility text DEFAULT 'friends_only' CHECK (phone_visibility IN ('public', 'friends_only', 'private')),
  
  -- Content controls
  message_requests text DEFAULT 'anyone' CHECK (message_requests IN ('anyone', 'friends_only', 'none')),
  post_comments text DEFAULT 'anyone' CHECK (post_comments IN ('anyone', 'friends_only', 'none')),
  event_invitations text DEFAULT 'manual' CHECK (event_invitations IN ('auto_accept', 'manual', 'block')),
  content_filtering text[] DEFAULT '{}',
  
  -- Notification settings
  notifications_new_messages boolean DEFAULT true,
  notifications_post_interactions boolean DEFAULT true,
  notifications_event_reminders boolean DEFAULT true,
  notifications_friend_activity boolean DEFAULT true,
  notifications_location_based boolean DEFAULT true,
  notifications_group_mentions boolean DEFAULT true,
  
  -- Push notification settings
  push_enabled boolean DEFAULT true,
  push_messages boolean DEFAULT true,
  push_interactions boolean DEFAULT true,
  push_reminders boolean DEFAULT true,
  push_friend_activity boolean DEFAULT false,
  push_location_based boolean DEFAULT true,
  push_mentions boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User skills table (sport-specific skill levels)
CREATE TABLE IF NOT EXISTS user_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport text NOT NULL,
  skill_level text NOT NULL CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, sport)
);

-- User availability table (weekly schedule)
CREATE TABLE IF NOT EXISTS user_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, day_of_week, start_time, end_time)
);

-- User profile media table (for managing uploads)
CREATE TABLE IF NOT EXISTS user_profile_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  media_type text NOT NULL CHECK (media_type IN ('profile_picture', 'cover_photo')),
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  url text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings (user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON user_skills (user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_sport ON user_skills (sport);
CREATE INDEX IF NOT EXISTS idx_user_availability_user_id ON user_availability (user_id);
CREATE INDEX IF NOT EXISTS idx_user_availability_day ON user_availability (day_of_week);
CREATE INDEX IF NOT EXISTS idx_user_profile_media_user_id ON user_profile_media (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_media_type ON user_profile_media (media_type);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_settings table
CREATE POLICY "Users can read own settings" ON user_settings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for user_skills table
CREATE POLICY "Users can read own skills" ON user_skills
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Others can read public skills" ON user_skills
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_settings us 
      WHERE us.user_id = user_skills.user_id 
      AND us.profile_visibility = 'public'
    )
  );

CREATE POLICY "Users can manage own skills" ON user_skills
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for user_availability table
CREATE POLICY "Users can read own availability" ON user_availability
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Others can read public availability" ON user_availability
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_settings us 
      WHERE us.user_id = user_availability.user_id 
      AND us.profile_visibility = 'public'
    )
  );

CREATE POLICY "Users can manage own availability" ON user_availability
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for user_profile_media table
CREATE POLICY "Users can read own media" ON user_profile_media
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Others can read public media" ON user_profile_media
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM user_settings us 
      WHERE us.user_id = user_profile_media.user_id 
      AND us.profile_visibility = 'public'
    )
  );

CREATE POLICY "Users can manage own media" ON user_profile_media
  FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Function to get user settings with defaults
CREATE OR REPLACE FUNCTION get_user_settings(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  profile_picture_url text,
  cover_photo_url text,
  location_city text,
  activity_radius integer,
  phone_number text,
  phone_verified boolean,
  profile_visibility text,
  location_sharing text,
  show_online_status boolean,
  activity_history_visibility text,
  phone_visibility text,
  message_requests text,
  post_comments text,
  event_invitations text,
  content_filtering text[],
  notifications_new_messages boolean,
  notifications_post_interactions boolean,
  notifications_event_reminders boolean,
  notifications_friend_activity boolean,
  notifications_location_based boolean,
  notifications_group_mentions boolean,
  push_enabled boolean,
  push_messages boolean,
  push_interactions boolean,
  push_reminders boolean,
  push_friend_activity boolean,
  push_location_based boolean,
  push_mentions boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    COALESCE(us.user_id, target_user_id) as user_id,
    us.profile_picture_url,
    us.cover_photo_url,
    us.location_city,
    COALESCE(us.activity_radius, 25000) as activity_radius,
    us.phone_number,
    COALESCE(us.phone_verified, false) as phone_verified,
    COALESCE(us.profile_visibility, 'public') as profile_visibility,
    COALESCE(us.location_sharing, 'general') as location_sharing,
    COALESCE(us.show_online_status, true) as show_online_status,
    COALESCE(us.activity_history_visibility, 'public') as activity_history_visibility,
    COALESCE(us.phone_visibility, 'friends_only') as phone_visibility,
    COALESCE(us.message_requests, 'anyone') as message_requests,
    COALESCE(us.post_comments, 'anyone') as post_comments,
    COALESCE(us.event_invitations, 'manual') as event_invitations,
    COALESCE(us.content_filtering, '{}') as content_filtering,
    COALESCE(us.notifications_new_messages, true) as notifications_new_messages,
    COALESCE(us.notifications_post_interactions, true) as notifications_post_interactions,
    COALESCE(us.notifications_event_reminders, true) as notifications_event_reminders,
    COALESCE(us.notifications_friend_activity, true) as notifications_friend_activity,
    COALESCE(us.notifications_location_based, true) as notifications_location_based,
    COALESCE(us.notifications_group_mentions, true) as notifications_group_mentions,
    COALESCE(us.push_enabled, true) as push_enabled,
    COALESCE(us.push_messages, true) as push_messages,
    COALESCE(us.push_interactions, true) as push_interactions,
    COALESCE(us.push_reminders, true) as push_reminders,
    COALESCE(us.push_friend_activity, false) as push_friend_activity,
    COALESCE(us.push_location_based, true) as push_location_based,
    COALESCE(us.push_mentions, true) as push_mentions,
    us.created_at,
    us.updated_at
  FROM (SELECT target_user_id as user_id) dummy
  LEFT JOIN user_settings us ON us.user_id = target_user_id;
$$;

-- Function to upsert user settings
CREATE OR REPLACE FUNCTION upsert_user_settings(
  target_user_id uuid,
  settings_data jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  result_id uuid;
BEGIN
  INSERT INTO user_settings (user_id)
  VALUES (target_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  UPDATE user_settings
  SET
    profile_picture_url = COALESCE((settings_data->>'profile_picture_url')::text, profile_picture_url),
    cover_photo_url = COALESCE((settings_data->>'cover_photo_url')::text, cover_photo_url),
    location_city = COALESCE((settings_data->>'location_city')::text, location_city),
    activity_radius = COALESCE((settings_data->>'activity_radius')::integer, activity_radius),
    phone_number = COALESCE((settings_data->>'phone_number')::text, phone_number),
    phone_verified = COALESCE((settings_data->>'phone_verified')::boolean, phone_verified),
    profile_visibility = COALESCE((settings_data->>'profile_visibility')::text, profile_visibility),
    location_sharing = COALESCE((settings_data->>'location_sharing')::text, location_sharing),
    show_online_status = COALESCE((settings_data->>'show_online_status')::boolean, show_online_status),
    activity_history_visibility = COALESCE((settings_data->>'activity_history_visibility')::text, activity_history_visibility),
    phone_visibility = COALESCE((settings_data->>'phone_visibility')::text, phone_visibility),
    message_requests = COALESCE((settings_data->>'message_requests')::text, message_requests),
    post_comments = COALESCE((settings_data->>'post_comments')::text, post_comments),
    event_invitations = COALESCE((settings_data->>'event_invitations')::text, event_invitations),
    content_filtering = COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(settings_data->'content_filtering')), 
      content_filtering
    ),
    notifications_new_messages = COALESCE((settings_data->>'notifications_new_messages')::boolean, notifications_new_messages),
    notifications_post_interactions = COALESCE((settings_data->>'notifications_post_interactions')::boolean, notifications_post_interactions),
    notifications_event_reminders = COALESCE((settings_data->>'notifications_event_reminders')::boolean, notifications_event_reminders),
    notifications_friend_activity = COALESCE((settings_data->>'notifications_friend_activity')::boolean, notifications_friend_activity),
    notifications_location_based = COALESCE((settings_data->>'notifications_location_based')::boolean, notifications_location_based),
    notifications_group_mentions = COALESCE((settings_data->>'notifications_group_mentions')::boolean, notifications_group_mentions),
    push_enabled = COALESCE((settings_data->>'push_enabled')::boolean, push_enabled),
    push_messages = COALESCE((settings_data->>'push_messages')::boolean, push_messages),
    push_interactions = COALESCE((settings_data->>'push_interactions')::boolean, push_interactions),
    push_reminders = COALESCE((settings_data->>'push_reminders')::boolean, push_reminders),
    push_friend_activity = COALESCE((settings_data->>'push_friend_activity')::boolean, push_friend_activity),
    push_location_based = COALESCE((settings_data->>'push_location_based')::boolean, push_location_based),
    push_mentions = COALESCE((settings_data->>'push_mentions')::boolean, push_mentions),
    updated_at = now()
  WHERE user_id = target_user_id
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$$;