/*
  # Fix Notification Functions

  1. Updates
    - Fix the ambiguous user_id column reference in mark_notifications_as_read function
    - Improve error handling for notification functions
*/

-- Drop and recreate the mark_notifications_as_read function
DROP FUNCTION IF EXISTS mark_notifications_as_read(uuid, uuid[]);

-- Recreate function with explicit table references to avoid ambiguity
CREATE OR REPLACE FUNCTION mark_notifications_as_read(uid uuid, notification_ids uuid[] DEFAULT NULL)
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
    WHERE notifications.user_id = uid AND is_read = false;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications 
    SET is_read = true 
    WHERE notifications.user_id = uid 
      AND id = ANY(notification_ids) 
      AND is_read = false;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  END IF;
  
  RETURN updated_count;
END;
$$;

-- Ensure get_unread_notification_count function doesn't have ambiguity
DROP FUNCTION IF EXISTS get_unread_notification_count(uuid);

CREATE OR REPLACE FUNCTION get_unread_notification_count(uid uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)
  FROM notifications
  WHERE notifications.user_id = uid AND is_read = false;
$$;

-- Ensure get_user_notifications function doesn't have ambiguity
DROP FUNCTION IF EXISTS get_user_notifications(uuid, integer);

CREATE OR REPLACE FUNCTION get_user_notifications(uid uuid, limit_count integer DEFAULT 20)
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
  WHERE n.user_id = uid
  ORDER BY n.created_at DESC
  LIMIT limit_count;
$$;

-- Create a dedicated function for marking all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(uid uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Mark all notifications as read
  UPDATE notifications 
  SET is_read = true 
  WHERE notifications.user_id = uid AND is_read = false;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN updated_count;
END;
$$;
