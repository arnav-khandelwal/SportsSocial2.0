/*
  # Reviews System

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `author_id` (uuid, foreign key)
      - `title` (text)
      - `content` (text)
      - `rating` (integer, 1-5)
      - `category` (text) - venue, event, general, etc.
      - `tags` (text array)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `review_votes`
      - `id` (uuid, primary key)
      - `review_id` (uuid, foreign key)
      - `user_id` (uuid, foreign key)
      - `vote_type` (text) - 'helpful', 'not_helpful'
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Functions
    - Function to get reviews with vote counts
    - Function to get user's vote on a review
*/

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  category text NOT NULL DEFAULT 'general',
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Review votes table
CREATE TABLE IF NOT EXISTS review_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('helpful', 'not_helpful')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_author_id ON reviews (author_id);
CREATE INDEX IF NOT EXISTS idx_reviews_category ON reviews (category);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews (rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_votes_review_id ON review_votes (review_id);
CREATE INDEX IF NOT EXISTS idx_review_votes_user_id ON review_votes (user_id);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews table
CREATE POLICY "Anyone can read active reviews" ON reviews
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own reviews" ON reviews
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- RLS Policies for review_votes table
CREATE POLICY "Users can read review votes" ON review_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can vote on reviews" ON review_votes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes" ON review_votes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON review_votes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to get reviews with vote counts and user's vote
CREATE OR REPLACE FUNCTION get_reviews_with_votes(requesting_user_id uuid DEFAULT NULL, category_filter text DEFAULT NULL, limit_count integer DEFAULT 20)
RETURNS TABLE(
  id uuid,
  author_id uuid,
  author_username text,
  title text,
  content text,
  rating integer,
  category text,
  tags text[],
  helpful_votes bigint,
  not_helpful_votes bigint,
  user_vote text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    r.id,
    r.author_id,
    u.username as author_username,
    r.title,
    r.content,
    r.rating,
    r.category,
    r.tags,
    COALESCE(helpful_count.count, 0) as helpful_votes,
    COALESCE(not_helpful_count.count, 0) as not_helpful_votes,
    user_vote.vote_type as user_vote,
    r.created_at,
    r.updated_at
  FROM reviews r
  JOIN users u ON u.id = r.author_id
  LEFT JOIN (
    SELECT review_id, COUNT(*) as count
    FROM review_votes
    WHERE vote_type = 'helpful'
    GROUP BY review_id
  ) helpful_count ON helpful_count.review_id = r.id
  LEFT JOIN (
    SELECT review_id, COUNT(*) as count
    FROM review_votes
    WHERE vote_type = 'not_helpful'
    GROUP BY review_id
  ) not_helpful_count ON not_helpful_count.review_id = r.id
  LEFT JOIN (
    SELECT review_id, vote_type
    FROM review_votes
    WHERE user_id = requesting_user_id
  ) user_vote ON user_vote.review_id = r.id
  WHERE r.is_active = true
    AND (category_filter IS NULL OR r.category = category_filter)
  ORDER BY r.created_at DESC
  LIMIT limit_count;
$$;

-- Function to vote on a review
CREATE OR REPLACE FUNCTION vote_on_review(review_id uuid, user_id uuid, vote_type text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update the vote
  INSERT INTO review_votes (review_id, user_id, vote_type)
  VALUES (review_id, user_id, vote_type)
  ON CONFLICT (review_id, user_id)
  DO UPDATE SET 
    vote_type = EXCLUDED.vote_type,
    created_at = now();
END;
$$;

-- Function to remove vote from a review
CREATE OR REPLACE FUNCTION remove_vote_from_review(review_id uuid, user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM review_votes
  WHERE review_id = remove_vote_from_review.review_id 
    AND user_id = remove_vote_from_review.user_id;
END;
$$;