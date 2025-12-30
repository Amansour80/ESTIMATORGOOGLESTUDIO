/*
  # Create Approval Notifications System
  
  ## Overview
  This migration creates the approval_notifications table that manages notifications
  for approval workflow events. Users receive notifications when actions are needed
  or when approval status changes.
  
  ## New Tables
  
  ### `approval_notifications`
  Stores notifications for approval workflow events.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique notification identifier
  - `project_approval_id` (uuid, foreign key) - Links to project_approvals table
  - `user_id` (uuid, foreign key) - User who receives the notification
  - `notification_type` (text) - Type of notification
  - `title` (text) - Notification title
  - `message` (text) - Notification message
  - `link` (text) - Deep link to relevant page
  - `is_read` (boolean) - Whether notification has been read
  - `sent_at` (timestamptz) - When notification was created
  - `read_at` (timestamptz) - When notification was read
  
  ## Security
  - Enable RLS on approval_notifications table
  - Users can only view their own notifications
  - Users can mark their notifications as read
  - System creates notifications
  - Super admins have full access
  
  ## Notes
  - Notifications are user-specific
  - Types include: pending_approval, approved, rejected, revision_requested, escalated
  - Real-time updates via Supabase subscriptions
*/

-- Create enum for notification types
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'pending_approval',
    'approval_reminder',
    'approved',
    'rejected',
    'revision_requested',
    'escalated',
    'delegated_to_you',
    'workflow_completed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create approval_notifications table
CREATE TABLE IF NOT EXISTS approval_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_approval_id uuid NOT NULL REFERENCES project_approvals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  
  -- Constraints
  CHECK (length(trim(title)) > 0),
  CHECK (length(trim(message)) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_notifications_user_id 
  ON approval_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_unread 
  ON approval_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_approval_notifications_approval_id 
  ON approval_notifications(project_approval_id);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_sent_at 
  ON approval_notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_notifications_type 
  ON approval_notifications(notification_type);

-- Enable RLS
ALTER TABLE approval_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON approval_notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON approval_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can update only their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON approval_notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON approval_notifications
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Super admins can view all notifications
CREATE POLICY "Super admins can view all notifications"
  ON approval_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Trigger to set read_at when is_read changes to true
CREATE OR REPLACE FUNCTION set_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_notification_read_at_trigger 
  ON approval_notifications;
CREATE TRIGGER set_notification_read_at_trigger
  BEFORE UPDATE ON approval_notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_read_at();

-- Helper function to create notification
CREATE OR REPLACE FUNCTION create_approval_notification(
  p_approval_id uuid,
  p_user_id uuid,
  p_type notification_type,
  p_title text,
  p_message text,
  p_link text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO approval_notifications (
    project_approval_id,
    user_id,
    notification_type,
    title,
    message,
    link
  ) VALUES (
    p_approval_id,
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to notify all users with specific role
CREATE OR REPLACE FUNCTION notify_users_with_role(
  p_approval_id uuid,
  p_role_id uuid,
  p_type notification_type,
  p_title text,
  p_message text,
  p_link text DEFAULT NULL
)
RETURNS int AS $$
DECLARE
  notification_count int := 0;
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT DISTINCT ura.user_id
    FROM user_role_assignments ura
    WHERE ura.role_id = p_role_id
      AND ura.is_active = true
  LOOP
    PERFORM create_approval_notification(
      p_approval_id,
      user_record.user_id,
      p_type,
      p_title,
      p_message,
      p_link
    );
    notification_count := notification_count + 1;
  END LOOP;
  
  RETURN notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get unread notification count for user
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id uuid)
RETURNS int AS $$
DECLARE
  unread_count int;
BEGIN
  SELECT COUNT(*)::int INTO unread_count
  FROM approval_notifications
  WHERE user_id = p_user_id
    AND is_read = false;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to mark all notifications as read for user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id uuid)
RETURNS int AS $$
DECLARE
  updated_count int;
BEGIN
  UPDATE approval_notifications
  SET is_read = true, read_at = now()
  WHERE user_id = p_user_id
    AND is_read = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get recent notifications for user
CREATE OR REPLACE FUNCTION get_recent_notifications(
  p_user_id uuid,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  notification_type notification_type,
  title text,
  message text,
  link text,
  is_read boolean,
  sent_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.notification_type,
    n.title,
    n.message,
    n.link,
    n.is_read,
    n.sent_at
  FROM approval_notifications n
  WHERE n.user_id = p_user_id
  ORDER BY n.sent_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;