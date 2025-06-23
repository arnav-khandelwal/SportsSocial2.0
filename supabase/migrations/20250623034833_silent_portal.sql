/*
  # Events System

  1. New Tables
    - `events`
      - `id` (uuid, primary key)
      - `organizer_id` (uuid, foreign key)
      - `title` (text)
      - `description` (text)
      - `sport` (text)
      - `location` (geography point)
      - `location_name` (text)
      - `event_date` (timestamp)
      - `duration_hours` (integer)
      - `max_participants` (integer)
      - `current_participants` (integer)
      - `skill_level` (text)
      - `equipment_provided` (boolean)
      - `cost` (decimal)
      - `tags` (text array)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `event_participants`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `status` (text) - 'registered', 'waitlist', 'cancelled'
      - `registered_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Functions
    - Function to find events within radius
    - Function to register for events
*/

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  sport text NOT NULL,
  location geography(POINT, 4326),
  location_name text NOT NULL,
  event_date timestamptz NOT NULL,
  duration_hours integer DEFAULT 2,
  max_participants integer NOT NULL CHECK (max_participants > 0),
  current_participants integer DEFAULT 0,
  skill_level text DEFAULT 'all' CHECK (skill_level IN ('beginner', 'intermediate', 'advanced', 'all')),
  equipment_provided boolean DEFAULT false,
  cost decimal(10,2) DEFAULT 0.00,
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Event participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'waitlist', 'cancelled')),
  registered_at timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_location ON events USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events (event_date);
CREATE INDEX IF NOT EXISTS idx_events_sport ON events (sport);
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events (organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events (is_active);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants (event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_status ON event_participants (status);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events table
CREATE POLICY "Anyone can read active events" ON events
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Users can create events" ON events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update own events" ON events
  FOR UPDATE TO authenticated USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete own events" ON events
  FOR DELETE TO authenticated USING (auth.uid() = organizer_id);

-- RLS Policies for event_participants table
CREATE POLICY "Users can read event participants" ON event_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can register for events" ON event_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own registrations" ON event_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can cancel own registrations" ON event_participants
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to find events within radius
CREATE OR REPLACE FUNCTION events_within_radius(lat double precision, lng double precision, radius_meters integer)
RETURNS TABLE(
  id uuid,
  organizer_id uuid,
  title text,
  description text,
  sport text,
  location_name text,
  event_date timestamptz,
  duration_hours integer,
  max_participants integer,
  current_participants integer,
  skill_level text,
  equipment_provided boolean,
  cost decimal,
  tags text[],
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  distance_meters double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    e.id,
    e.organizer_id,
    e.title,
    e.description,
    e.sport,
    e.location_name,
    e.event_date,
    e.duration_hours,
    e.max_participants,
    e.current_participants,
    e.skill_level,
    e.equipment_provided,
    e.cost,
    e.tags,
    e.is_active,
    e.created_at,
    e.updated_at,
    ST_Distance(e.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)) as distance_meters
  FROM events e
  WHERE e.is_active = true
    AND e.event_date > now()
    AND ST_DWithin(e.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326), radius_meters)
  ORDER BY distance_meters;
$$;

-- Function to register for an event
CREATE OR REPLACE FUNCTION register_for_event(event_id uuid, user_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  event_record record;
  registration_status text;
BEGIN
  -- Get event details
  SELECT * INTO event_record FROM events WHERE id = event_id AND is_active = true;
  
  IF event_record IS NULL THEN
    RETURN 'event_not_found';
  END IF;
  
  -- Check if event is in the future
  IF event_record.event_date <= now() THEN
    RETURN 'event_past';
  END IF;
  
  -- Check if user is already registered
  IF EXISTS (SELECT 1 FROM event_participants WHERE event_id = register_for_event.event_id AND user_id = register_for_event.user_id) THEN
    RETURN 'already_registered';
  END IF;
  
  -- Determine registration status
  IF event_record.current_participants < event_record.max_participants THEN
    registration_status := 'registered';
    
    -- Update current participants count
    UPDATE events 
    SET current_participants = current_participants + 1,
        updated_at = now()
    WHERE id = event_id;
  ELSE
    registration_status := 'waitlist';
  END IF;
  
  -- Insert registration
  INSERT INTO event_participants (event_id, user_id, status)
  VALUES (event_id, user_id, registration_status);
  
  RETURN registration_status;
END;
$$;

-- Function to cancel event registration
CREATE OR REPLACE FUNCTION cancel_event_registration(event_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  participant_status text;
BEGIN
  -- Get participant status
  SELECT status INTO participant_status 
  FROM event_participants 
  WHERE event_id = cancel_event_registration.event_id 
    AND user_id = cancel_event_registration.user_id;
  
  IF participant_status IS NULL THEN
    RETURN false;
  END IF;
  
  -- Remove registration
  DELETE FROM event_participants 
  WHERE event_id = cancel_event_registration.event_id 
    AND user_id = cancel_event_registration.user_id;
  
  -- Update current participants count if they were registered (not waitlisted)
  IF participant_status = 'registered' THEN
    UPDATE events 
    SET current_participants = current_participants - 1,
        updated_at = now()
    WHERE id = event_id;
    
    -- Promote someone from waitlist if available
    UPDATE event_participants 
    SET status = 'registered'
    WHERE event_id = cancel_event_registration.event_id 
      AND status = 'waitlist'
      AND id = (
        SELECT id FROM event_participants 
        WHERE event_id = cancel_event_registration.event_id 
          AND status = 'waitlist' 
        ORDER BY registered_at 
        LIMIT 1
      );
    
    -- Update count again if someone was promoted
    UPDATE events 
    SET current_participants = (
      SELECT COUNT(*) FROM event_participants 
      WHERE event_id = cancel_event_registration.event_id 
        AND status = 'registered'
    ),
    updated_at = now()
    WHERE id = event_id;
  END IF;
  
  RETURN true;
END;
$$;