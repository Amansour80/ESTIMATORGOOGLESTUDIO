/*
  # Create User Notifications Table

  1. New Tables
    - `user_notifications` - Stores all user notifications for the system
  
  2. Security
    - Enable RLS
    - Users can only view their own notifications
    - System can create notifications for any user

  3. Purpose
    - Used by activity status change triggers
    - Used by document workflow triggers
    - Used by issue assignment triggers
    - Used by approval workflow system
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
      'approval_required',
      'activity_assigned',
      'activity_status_changed',
      'document_submitted',
      'document_decision',
      'issue_assigned',
      'issue_status_changed',
      'comment_mention'
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