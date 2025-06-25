-- Migration to create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id text,
    event_title text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    team_name text,
    extra text,
    registration_date timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for faster event-based queries
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_title ON event_registrations(event_title);
