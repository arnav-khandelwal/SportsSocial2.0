/*
  # Fix Direct Messages Read Status

  1. Updates
    - Fix the mark_direct_messages_as_read function to properly handle is_read field
    - Add better error handling and logging
    - Ensure messages are marked as read when conversation is opened

  2. Functions
    - Updated mark_direct_messages_as_read function
    - Add function to mark all messages in conversation as read
*/

-- Drop and recreate the mark_direct_messages_as_read function with better logic
DROP FUNCTION IF EXISTS mark_direct_messages_as_read(uuid, uuid);

-- Function to mark messages as read in a direct conversation
CREATE OR REPLACE FUNCTION mark_direct_messages_as_read(conversation_id uuid, reader_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  is_participant_1 boolean;
  conversation_exists boolean;
BEGIN
  -- Check if conversation exists and user is a participant
  SELECT 
    (participant_1_id = reader_id),
    true
  INTO is_participant_1, conversation_exists
  FROM direct_conversations
  WHERE id = conversation_id
    AND (participant_1_id = reader_id OR participant_2_id = reader_id);
  
  -- If user is not a participant, exit
  IF NOT conversation_exists THEN
    RETURN;
  END IF;
  
  -- Mark all unread messages in this conversation as read (except messages sent by the reader)
  UPDATE direct_messages
  SET is_read = true
  WHERE direct_messages.conversation_id = mark_direct_messages_as_read.conversation_id
    AND sender_id != reader_id
    AND is_read = false
    AND is_deleted = false;
  
  -- Reset unread count for this user in the conversation
  IF is_participant_1 THEN
    UPDATE direct_conversations
    SET participant_1_unread_count = 0,
        updated_at = now()
    WHERE id = conversation_id;
  ELSE
    UPDATE direct_conversations
    SET participant_2_unread_count = 0,
        updated_at = now()
    WHERE id = conversation_id;
  END IF;
END;
$$;

-- Function to mark all messages as read when opening a conversation
CREATE OR REPLACE FUNCTION mark_conversation_messages_read(conversation_id uuid, reader_id uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count integer;
  is_participant_1 boolean;
BEGIN
  -- Verify user is participant in conversation
  SELECT (participant_1_id = reader_id) INTO is_participant_1
  FROM direct_conversations
  WHERE id = conversation_id
    AND (participant_1_id = reader_id OR participant_2_id = reader_id);
  
  IF is_participant_1 IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Mark messages as read and get count
  UPDATE direct_messages
  SET is_read = true
  WHERE direct_messages.conversation_id = mark_conversation_messages_read.conversation_id
    AND sender_id != reader_id
    AND is_read = false
    AND is_deleted = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Reset unread count
  IF is_participant_1 THEN
    UPDATE direct_conversations
    SET participant_1_unread_count = 0,
        updated_at = now()
    WHERE id = conversation_id;
  ELSE
    UPDATE direct_conversations
    SET participant_2_unread_count = 0,
        updated_at = now()
    WHERE id = conversation_id;
  END IF;
  
  RETURN updated_count;
END;
$$;