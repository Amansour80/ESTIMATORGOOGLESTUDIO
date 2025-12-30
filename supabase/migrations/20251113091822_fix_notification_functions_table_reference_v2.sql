/*
  # Fix notification functions to use correct table

  Fix the `mark_notification_read` and `mark_all_notifications_read` functions
  to update the `approval_notifications` table instead of the dropped `user_notifications` table.

  ## Changes
  - Update `mark_notification_read` to target `approval_notifications`
  - Update `mark_all_notifications_read` to target `approval_notifications`
  - Drop and recreate `get_unread_notification_count` to query `approval_notifications`
*/

-- Fix mark_notification_read function
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE approval_notifications
  SET 
    is_read = true,
    read_at = now()
  WHERE id = p_notification_id
    AND user_id = auth.uid();
END;
$$;

-- Fix mark_all_notifications_read function
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE approval_notifications
  SET 
    is_read = true,
    read_at = now()
  WHERE user_id = auth.uid()
    AND is_read = false;
END;
$$;

-- Drop and recreate get_unread_notification_count function with correct return type
DROP FUNCTION IF EXISTS get_unread_notification_count();

CREATE FUNCTION get_unread_notification_count()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count bigint;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM approval_notifications
  WHERE user_id = auth.uid()
    AND is_read = false;
  
  RETURN v_count;
END;
$$;