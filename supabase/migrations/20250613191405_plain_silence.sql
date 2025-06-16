/*
  # Initial Schema for Sports Social

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `email` (text, unique)
      - `password` (text)
      - `bio` (text)
      - `sports` (text array)
      - `tags` (text array)
      - `is_online` (boolean)
      - `last_seen` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `posts`
      - `id` (uuid, primary key)
      - `author_id` (uuid, foreign key)
      - `sport` (text)
      - `heading` (text)
      - `description` (text)
      - `tags` (text array)
      - `location` (geography point)
      - `location_name` (text)
      - `event_time` (timestamp)
      - `players_needed` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `post_interests`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `user_followers`
      - `id` (uuid, primary key)
      - `follower_id` (uuid, foreign key)
      - `following_id` (uuid, foreign key)
      - `created_at` (timestamp)
    
    - `group_chats`
      - `id` (uuid, primary key)
      - `name` (text)
      - `post_id` (uuid, foreign key)
      - `admin_id` (uuid, foreign key)
      - `member_ids` (uuid array)
      - `last_message_id` (uuid, foreign key)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key)
      - `recipient_id` (uuid, foreign key, nullable)
      - `group_chat_id` (uuid, foreign key, nullable)
      - `content` (text)
      - `message_type` (text, enum: 'direct', 'group')
      - `is_deleted` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access where appropriate

  3. Functions
    - Function to find posts within radius using PostGIS
    - Function to get direct message conversations
*/

-- Enable PostGIS extension for geolocation
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  bio text DEFAULT '',
  sports text[] DEFAULT '{}',
  tags text[] DEFAULT '{}',
  is_online boolean DEFAULT false,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport text NOT NULL,
  heading text NOT NULL,
  description text NOT NULL,
  tags text[] DEFAULT '{}',
  location geography(POINT, 4326),
  location_name text NOT NULL,
  event_time timestamptz NOT NULL,
  players_needed integer NOT NULL CHECK (players_needed > 0),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Post interests table
CREATE TABLE IF NOT EXISTS post_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- User followers table
CREATE TABLE IF NOT EXISTS user_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id)
);

-- Group chats table
CREATE TABLE IF NOT EXISTS group_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_ids uuid[] DEFAULT '{}',
  last_message_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  group_chat_id uuid REFERENCES group_chats(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text NOT NULL CHECK (message_type IN ('direct', 'group')),
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (message_type = 'direct' AND recipient_id IS NOT NULL AND group_chat_id IS NULL) OR
    (message_type = 'group' AND group_chat_id IS NOT NULL AND recipient_id IS NULL)
  )
);

-- Add foreign key for last_message_id after messages table is created
ALTER TABLE group_chats 
ADD CONSTRAINT group_chats_last_message_id_fkey 
FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_posts_location ON posts USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_posts_event_time ON posts (event_time);
CREATE INDEX IF NOT EXISTS idx_posts_sport ON posts (sport);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts (author_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient ON messages (sender_id, recipient_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_group_chat ON messages (group_chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_interests_post_id ON post_interests (post_id);
CREATE INDEX IF NOT EXISTS idx_post_interests_user_id ON post_interests (user_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_follower ON user_followers (follower_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_following ON user_followers (following_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read all profiles" ON users
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- RLS Policies for posts table
CREATE POLICY "Anyone can read active posts" ON posts
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Users can create posts" ON posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- RLS Policies for post_interests table
CREATE POLICY "Users can read post interests" ON post_interests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can add interest to posts" ON post_interests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own interests" ON post_interests
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- RLS Policies for user_followers table
CREATE POLICY "Users can read follower relationships" ON user_followers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can follow others" ON user_followers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" ON user_followers
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- RLS Policies for group_chats table
CREATE POLICY "Users can read group chats they're members of" ON group_chats
  FOR SELECT TO authenticated USING (auth.uid() = ANY(member_ids) OR auth.uid() = admin_id);

CREATE POLICY "Users can create group chats" ON group_chats
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update group chats" ON group_chats
  FOR UPDATE TO authenticated USING (auth.uid() = admin_id);

-- RLS Policies for messages table
CREATE POLICY "Users can read their direct messages" ON messages
  FOR SELECT TO authenticated USING (
    message_type = 'direct' AND (auth.uid() = sender_id OR auth.uid() = recipient_id)
  );

CREATE POLICY "Users can read group messages they're part of" ON messages
  FOR SELECT TO authenticated USING (
    message_type = 'group' AND EXISTS (
      SELECT 1 FROM group_chats 
      WHERE id = group_chat_id AND (auth.uid() = ANY(member_ids) OR auth.uid() = admin_id)
    )
  );

CREATE POLICY "Users can send direct messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (
    message_type = 'direct' AND auth.uid() = sender_id
  );

CREATE POLICY "Users can send group messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (
    message_type = 'group' AND auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM group_chats 
      WHERE id = group_chat_id AND (auth.uid() = ANY(member_ids) OR auth.uid() = admin_id)
    )
  );

-- Function to find posts within radius
CREATE OR REPLACE FUNCTION posts_within_radius(lat double precision, lng double precision, radius_meters integer)
RETURNS TABLE(
  id uuid,
  author_id uuid,
  sport text,
  heading text,
  description text,
  tags text[],
  location_name text,
  event_time timestamptz,
  players_needed integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  distance_meters double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    p.id,
    p.author_id,
    p.sport,
    p.heading,
    p.description,
    p.tags,
    p.location_name,
    p.event_time,
    p.players_needed,
    p.is_active,
    p.created_at,
    p.updated_at,
    ST_Distance(p.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)) as distance_meters
  FROM posts p
  WHERE p.is_active = true
    AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326), radius_meters)
  ORDER BY distance_meters;
$$;

-- Function to get direct message conversations
CREATE OR REPLACE FUNCTION get_direct_conversations(user_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  is_online boolean,
  last_message_content text,
  last_message_time timestamptz
)
LANGUAGE sql
STABLE
AS $$
  WITH conversation_partners AS (
    SELECT DISTINCT
      CASE 
        WHEN sender_id = user_id THEN recipient_id
        ELSE sender_id
      END as partner_id
    FROM messages
    WHERE message_type = 'direct'
      AND (sender_id = user_id OR recipient_id = user_id)
      AND is_deleted = false
  ),
  latest_messages AS (
    SELECT DISTINCT ON (
      CASE 
        WHEN sender_id = user_id THEN recipient_id
        ELSE sender_id
      END
    )
      CASE 
        WHEN sender_id = user_id THEN recipient_id
        ELSE sender_id
      END as partner_id,
      content as last_message_content,
      created_at as last_message_time
    FROM messages
    WHERE message_type = 'direct'
      AND (sender_id = user_id OR recipient_id = user_id)
      AND is_deleted = false
    ORDER BY 
      CASE 
        WHEN sender_id = user_id THEN recipient_id
        ELSE sender_id
      END,
      created_at DESC
  )
  SELECT 
    u.id,
    u.username,
    u.is_online,
    lm.last_message_content,
    lm.last_message_time
  FROM conversation_partners cp
  JOIN users u ON u.id = cp.partner_id
  LEFT JOIN latest_messages lm ON lm.partner_id = cp.partner_id
  ORDER BY lm.last_message_time DESC NULLS LAST;
$$;