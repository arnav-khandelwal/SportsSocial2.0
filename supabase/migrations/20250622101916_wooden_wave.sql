/*
  # Direct Messages System

  1. New Tables
    - `direct_conversations`
      - `id` (uuid, primary key)
      - `participant_1_id` (uuid, foreign key)
      - `participant_2_id` (uuid, foreign key)
      - `last_message_id` (uuid, foreign key)
      - `participant_1_unread_count` (integer)
      - `participant_2_unread_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `direct_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key)
      - `sender_id` (uuid, foreign key)
      - `content` (text)
      - `is_read` (boolean)
      - `is_deleted` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for participants to access their conversations

  3. Functions
    - Function to get or create conversation between two users
    - Function to get conversation messages
    - Function to mark messages as read
    - Function to get user's conversations with unread counts
*/

-- Direct conversations table
CREATE TABLE IF NOT EXISTS direct_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_2_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_id uuid,
  participant_1_unread_count integer DEFAULT 0,
  participant_2_unread_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (participant_1_id != participant_2_id),
  UNIQUE(participant_1_id, participant_2_id)
);

-- Direct messages table
CREATE TABLE IF NOT EXISTS direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES direct_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key for last_message_id after direct_messages table is created
ALTER TABLE direct_conversations 
ADD CONSTRAINT direct_conversations_last_message_id_fkey 
FOREIGN KEY (last_message_id) REFERENCES direct_messages(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_conversations_participant_1 ON direct_conversations (participant_1_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_participant_2 ON direct_conversations (participant_2_id);
CREATE INDEX IF NOT EXISTS idx_direct_conversations_updated_at ON direct_conversations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_id ON direct_messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON direct_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_is_read ON direct_messages (is_read);

-- Enable Row Level Security
ALTER TABLE direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for direct_conversations table
CREATE POLICY "Users can read their conversations" ON direct_conversations
  FOR SELECT TO authenticated USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

CREATE POLICY "Users can update their conversations" ON direct_conversations
  FOR UPDATE TO authenticated USING (
    auth.uid() = participant_1_id OR auth.uid() = participant_2_id
  );

-- RLS Policies for direct_messages table
CREATE POLICY "Users can read their conversation messages" ON direct_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM direct_conversations dc 
      WHERE dc.id = conversation_id 
      AND (auth.uid() = dc.participant_1_id OR auth.uid() = dc.participant_2_id)
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON direct_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM direct_conversations dc 
      WHERE dc.id = conversation_id 
      AND (auth.uid() = dc.participant_1_id OR auth.uid() = dc.participant_2_id)
    )
  );

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  conversation_id uuid;
  ordered_user1_id uuid;
  ordered_user2_id uuid;
BEGIN
  -- Ensure consistent ordering to avoid duplicate conversations
  IF user1_id < user2_id THEN
    ordered_user1_id := user1_id;
    ordered_user2_id := user2_id;
  ELSE
    ordered_user1_id := user2_id;
    ordered_user2_id := user1_id;
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conversation_id
  FROM direct_conversations
  WHERE participant_1_id = ordered_user1_id AND participant_2_id = ordered_user2_id;
  
  -- Create conversation if it doesn't exist
  IF conversation_id IS NULL THEN
    INSERT INTO direct_conversations (participant_1_id, participant_2_id)
    VALUES (ordered_user1_id, ordered_user2_id)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$;

-- Function to send a direct message
CREATE OR REPLACE FUNCTION send_direct_message(sender_id uuid, recipient_id uuid, message_content text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  conversation_id uuid;
  message_id uuid;
  is_participant_1 boolean;
BEGIN
  -- Get or create conversation
  SELECT get_or_create_direct_conversation(sender_id, recipient_id) INTO conversation_id;
  
  -- Insert the message
  INSERT INTO direct_messages (conversation_id, sender_id, content)
  VALUES (conversation_id, sender_id, message_content)
  RETURNING id INTO message_id;
  
  -- Determine if sender is participant_1 or participant_2
  SELECT (participant_1_id = sender_id) INTO is_participant_1
  FROM direct_conversations
  WHERE id = conversation_id;
  
  -- Update conversation metadata
  IF is_participant_1 THEN
    UPDATE direct_conversations
    SET 
      last_message_id = message_id,
      participant_2_unread_count = participant_2_unread_count + 1,
      updated_at = now()
    WHERE id = conversation_id;
  ELSE
    UPDATE direct_conversations
    SET 
      last_message_id = message_id,
      participant_1_unread_count = participant_1_unread_count + 1,
      updated_at = now()
    WHERE id = conversation_id;
  END IF;
  
  RETURN message_id;
END;
$$;

-- Function to get conversation messages
CREATE OR REPLACE FUNCTION get_direct_conversation_messages(conversation_id uuid, requesting_user_id uuid)
RETURNS TABLE(
  id uuid,
  sender_id uuid,
  sender_username text,
  content text,
  is_read boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    dm.id,
    dm.sender_id,
    u.username as sender_username,
    dm.content,
    dm.is_read,
    dm.created_at
  FROM direct_messages dm
  JOIN users u ON u.id = dm.sender_id
  JOIN direct_conversations dc ON dc.id = dm.conversation_id
  WHERE dm.conversation_id = get_direct_conversation_messages.conversation_id
    AND dm.is_deleted = false
    AND (requesting_user_id = dc.participant_1_id OR requesting_user_id = dc.participant_2_id)
  ORDER BY dm.created_at ASC;
$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_direct_messages_as_read(conversation_id uuid, reader_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  is_participant_1 boolean;
BEGIN
  -- Check if user is participant in this conversation
  SELECT (participant_1_id = reader_id) INTO is_participant_1
  FROM direct_conversations
  WHERE id = conversation_id
    AND (participant_1_id = reader_id OR participant_2_id = reader_id);
  
  IF is_participant_1 IS NOT NULL THEN
    -- Mark messages as read (only messages not sent by the reader)
    UPDATE direct_messages
    SET is_read = true
    WHERE conversation_id = mark_direct_messages_as_read.conversation_id
      AND sender_id != reader_id
      AND is_read = false;
    
    -- Reset unread count for this user
    IF is_participant_1 THEN
      UPDATE direct_conversations
      SET participant_1_unread_count = 0
      WHERE id = conversation_id;
    ELSE
      UPDATE direct_conversations
      SET participant_2_unread_count = 0
      WHERE id = conversation_id;
    END IF;
  END IF;
END;
$$;

-- Function to get user's direct conversations
CREATE OR REPLACE FUNCTION get_user_direct_conversations(user_id uuid)
RETURNS TABLE(
  conversation_id uuid,
  other_user_id uuid,
  other_user_username text,
  other_user_is_online boolean,
  last_message_content text,
  last_message_time timestamptz,
  unread_count integer
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    dc.id as conversation_id,
    CASE 
      WHEN dc.participant_1_id = user_id THEN dc.participant_2_id
      ELSE dc.participant_1_id
    END as other_user_id,
    CASE 
      WHEN dc.participant_1_id = user_id THEN u2.username
      ELSE u1.username
    END as other_user_username,
    CASE 
      WHEN dc.participant_1_id = user_id THEN u2.is_online
      ELSE u1.is_online
    END as other_user_is_online,
    dm.content as last_message_content,
    dm.created_at as last_message_time,
    CASE 
      WHEN dc.participant_1_id = user_id THEN dc.participant_1_unread_count
      ELSE dc.participant_2_unread_count
    END as unread_count
  FROM direct_conversations dc
  JOIN users u1 ON u1.id = dc.participant_1_id
  JOIN users u2 ON u2.id = dc.participant_2_id
  LEFT JOIN direct_messages dm ON dm.id = dc.last_message_id
  WHERE dc.participant_1_id = user_id OR dc.participant_2_id = user_id
  ORDER BY dc.updated_at DESC;
$$;

-- Function to get total unread direct messages count
CREATE OR REPLACE FUNCTION get_user_direct_messages_unread_count(user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(
    CASE 
      WHEN participant_1_id = user_id THEN participant_1_unread_count
      ELSE participant_2_unread_count
    END
  ), 0)
  FROM direct_conversations
  WHERE participant_1_id = user_id OR participant_2_id = user_id;
$$;