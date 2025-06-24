-- Migration: Add sport_type column, constraint, and indexes for posts table
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS sport_type TEXT DEFAULT 'TRADITIONAL';

-- Enforce allowed values for sport_type
ALTER TABLE posts
  ADD CONSTRAINT IF NOT EXISTS sport_type_check CHECK (sport_type IN ('TRADITIONAL', 'ESPORT'));

-- Add indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_posts_sport ON posts USING GIN (sport);
CREATE INDEX IF NOT EXISTS idx_posts_sport_type ON posts (sport_type);
