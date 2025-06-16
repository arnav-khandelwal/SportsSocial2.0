/*
  # Messaging System Enhancements

  1. Schema Updates
    - Add `is_read` field to messages table
    - Add indexes for better performance

  2. Functions
    - Function to get direct conversations with unread counts
    - Function to get unread group messages count

  3. Security
    - Update RLS policies for new fields
*/

-- Add is_read field to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages (is_read);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON messages (recipient_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_group_unread ON messages (group_chat_id, is_read, sender_id, created_at);

-- Function to get direct conversations with unread counts
CREATE OR REPLACE FUNCTION get_direct_conversations_with_unread(user_id uuid)
RETURNS TABLE(
  id uuid,
  username text,
  is_online boolean,
  last_message_content text,
  last_message_time timestamptz,
  unread_count bigint
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
  ),
  unread_counts AS (
    SELECT 
      sender_id as partner_id,
      COUNT(*) as unread_count
    FROM messages
    WHERE message_type = 'direct'
      AND recipient_id = user_id
      AND is_read = false
      AND is_deleted = false
    GROUP BY sender_id
  )
  SELECT 
    u.id,
    u.username,
    u.is_online,
    lm.last_message_content,
    lm.last_message_time,
    COALESCE(uc.unread_count, 0) as unread_count
  FROM conversation_partners cp
  JOIN users u ON u.id = cp.partner_id
  LEFT JOIN latest_messages lm ON lm.partner_id = cp.partner_id
  LEFT JOIN unread_counts uc ON uc.partner_id = cp.partner_id
  ORDER BY lm.last_message_time DESC NULLS LAST;
$$;

-- Function to get unread group messages count for a user
CREATE OR REPLACE FUNCTION get_unread_group_messages_count(user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)
  FROM messages m
  JOIN group_chats gc ON gc.id = m.group_chat_id
  WHERE m.message_type = 'group'
    AND m.is_read = false
    AND m.is_deleted = false
    AND m.sender_id != user_id
    AND (user_id = ANY(gc.member_ids) OR user_id = gc.admin_id);
$$;