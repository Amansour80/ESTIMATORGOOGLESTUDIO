/*
  # Fix notification RPC functions to use correct table

  1. Changes
    - Update mark_notification_read to use user_notifications table
    - Update mark_all_notifications_read to use user_notifications table
  
  2. Security
    - Functions maintain SECURITY DEFINER with auth checks
*/

-- Drop and recreate mark_notification_read
DROP FUNCTION IF EXISTS mark_notification_read(uuid);

CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE user_notifications
  SET 
    is_read = true,
    read_at = now()
  WHERE id = p_notification_id
  AND user_id = auth.uid();
END;
$$;

-- Drop and recreate mark_all_notifications_read
DROP FUNCTION IF EXISTS mark_all_notifications_read();

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE user_notifications
  SET 
    is_read = true,
    read_at = now()
  WHERE user_id = auth.uid()
  AND is_read = false;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_read() TO authenticated;
