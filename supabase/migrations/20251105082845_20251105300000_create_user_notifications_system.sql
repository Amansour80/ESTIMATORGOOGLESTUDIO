/*
  # Create User Notifications System

  ## New Tables
  
  ### `user_notifications`
  - `id` (uuid, primary key) - Unique notification identifier
  - `user_id` (uuid, foreign key) - User who receives the notification
  - `organization_id` (uuid, foreign key) - Organization context
  - `notification_type` (text) - Type: 'approval_approved', 'approval_rejected', 'revision_requested', 'submitted_for_approval'
  - `title` (text) - Notification title
  - `message` (text) - Notification message
  - `project_id` (uuid) - Related project ID (nullable)
  - `project_type` (text) - Project type: 'hk', 'fm', 'retrofit' (nullable)
  - `project_name` (text) - Project name for quick display
  - `approval_id` (uuid) - Related approval ID (nullable)
  - `metadata` (jsonb) - Additional data (comments, approver info, etc.)
  - `is_read` (boolean, default false) - Read status
  - `created_at` (timestamptz) - When notification was created
  - `read_at` (timestamptz) - When notification was read (nullable)

  ## Security
  - Enable RLS on `user_notifications` table
  - Users can only view their own notifications
  - System can create notifications for any user
*/

-- Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  project_id uuid,
  project_type text,
  project_name text,
  approval_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  CONSTRAINT valid_notification_type CHECK (
    notification_type IN (
      'approval_approved',
      'approval_rejected', 
      'revision_requested',
      'submitted_for_approval',
      'approval_required'
    )
  ),
  CONSTRAINT valid_project_type CHECK (
    project_type IS NULL OR project_type IN ('hk', 'fm', 'retrofit')
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_org_id ON user_notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_project ON user_notifications(project_id, project_type);

-- Enable RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON user_notifications
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- Users can mark their own notifications as read
CREATE POLICY "Users can update own notifications"
  ON user_notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System functions can create notifications for any user
CREATE POLICY "System can create notifications"
  ON user_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_organization_id uuid,
  p_notification_type text,
  p_title text,
  p_message text,
  p_project_id uuid DEFAULT NULL,
  p_project_type text DEFAULT NULL,
  p_project_name text DEFAULT NULL,
  p_approval_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_notification_id uuid;
BEGIN
  INSERT INTO user_notifications (
    user_id,
    organization_id,
    notification_type,
    title,
    message,
    project_id,
    project_type,
    project_name,
    approval_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_organization_id,
    p_notification_type,
    p_title,
    p_message,
    p_project_id,
    p_project_type,
    p_project_name,
    p_approval_id,
    p_metadata
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_count
  FROM user_notifications
  WHERE user_id = auth.uid()
    AND is_read = false;
  
  RETURN v_count;
END;
$$;