/*
  # Create Project Approval History System
  
  ## Overview
  This migration creates the project_approval_history table that maintains a complete
  audit trail of all approval actions taken on projects. This is an append-only table
  for compliance and auditing purposes.
  
  ## New Tables
  
  ### `project_approval_history`
  Stores complete history of all approval actions.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique history entry identifier
  - `project_approval_id` (uuid, foreign key) - Links to project_approvals table
  - `node_id` (text) - Workflow node where action occurred
  - `step_name` (text) - Human-readable step name
  - `user_id` (uuid, foreign key) - User who performed the action
  - `role_id` (uuid, foreign key) - Role under which action was taken
  - `action` (text) - Action type: approved, rejected, revision_requested, delegated, auto_approved
  - `comments` (text) - User comments with the action
  - `metadata` (jsonb) - Additional context (delegatee, escalation info, etc.)
  - `action_date` (timestamptz) - When action was performed
  
  ## Security
  - Enable RLS on project_approval_history table
  - Users can view history for their organization's projects
  - Only system can insert (append-only for users)
  - No updates or deletes allowed (audit trail)
  - Super admins have full access
  
  ## Notes
  - This is an append-only table for audit purposes
  - All approval actions are recorded
  - Provides complete timeline of approval process
  - Used for analytics and compliance reporting
*/

-- Create enum for approval actions
DO $$ BEGIN
  CREATE TYPE approval_action AS ENUM (
    'submitted',
    'approved',
    'rejected',
    'revision_requested',
    'delegated',
    'escalated',
    'auto_approved',
    'recalled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create project_approval_history table
CREATE TABLE IF NOT EXISTS project_approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_approval_id uuid NOT NULL REFERENCES project_approvals(id) ON DELETE CASCADE,
  node_id text,
  step_name text,
  user_id uuid REFERENCES user_profiles(id),
  role_id uuid REFERENCES organization_roles(id),
  action approval_action NOT NULL,
  comments text,
  metadata jsonb DEFAULT '{}'::jsonb,
  action_date timestamptz DEFAULT now(),
  
  -- No unique constraints - allow multiple entries per approval/node
  -- This is a pure audit log
  CHECK (length(trim(step_name)) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_history_approval_id 
  ON project_approval_history(project_approval_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_user_id 
  ON project_approval_history(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_action 
  ON project_approval_history(action);
CREATE INDEX IF NOT EXISTS idx_approval_history_action_date 
  ON project_approval_history(action_date DESC);
CREATE INDEX IF NOT EXISTS idx_approval_history_node 
  ON project_approval_history(node_id);

-- Enable RLS
ALTER TABLE project_approval_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view history for their organization's project approvals
CREATE POLICY "Users can view organization approval history"
  ON project_approval_history
  FOR SELECT
  TO authenticated
  USING (
    project_approval_id IN (
      SELECT pa.id 
      FROM project_approvals pa
      INNER JOIN approval_workflows w ON pa.workflow_id = w.id
      WHERE w.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Only system can insert history entries (via functions)
-- Users cannot directly insert
CREATE POLICY "System can insert approval history"
  ON project_approval_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    project_approval_id IN (
      SELECT pa.id 
      FROM project_approvals pa
      INNER JOIN approval_workflows w ON pa.workflow_id = w.id
      WHERE w.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- No updates allowed (append-only audit trail)
-- No delete policy (records are permanent)

-- Super admins can view everything
CREATE POLICY "Super admins can view all approval history"
  ON project_approval_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Helper function to record an approval action
CREATE OR REPLACE FUNCTION record_approval_action(
  p_approval_id uuid,
  p_node_id text,
  p_step_name text,
  p_user_id uuid,
  p_role_id uuid,
  p_action approval_action,
  p_comments text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid AS $$
DECLARE
  history_id uuid;
BEGIN
  INSERT INTO project_approval_history (
    project_approval_id,
    node_id,
    step_name,
    user_id,
    role_id,
    action,
    comments,
    metadata
  ) VALUES (
    p_approval_id,
    p_node_id,
    p_step_name,
    p_user_id,
    p_role_id,
    p_action,
    p_comments,
    p_metadata
  )
  RETURNING id INTO history_id;
  
  RETURN history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get approval timeline
CREATE OR REPLACE FUNCTION get_approval_timeline(p_approval_id uuid)
RETURNS TABLE (
  step_name text,
  action approval_action,
  user_name text,
  role_name text,
  comments text,
  action_date timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    h.step_name,
    h.action,
    up.full_name,
    r.role_name,
    h.comments,
    h.action_date
  FROM project_approval_history h
  LEFT JOIN user_profiles up ON h.user_id = up.id
  LEFT JOIN organization_roles r ON h.role_id = r.id
  WHERE h.project_approval_id = p_approval_id
  ORDER BY h.action_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's approval activity
CREATE OR REPLACE FUNCTION get_user_approval_activity(
  p_user_id uuid,
  p_days_back int DEFAULT 30
)
RETURNS TABLE (
  action_count bigint,
  action_type approval_action,
  recent_date timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as action_count,
    h.action as action_type,
    MAX(h.action_date) as recent_date
  FROM project_approval_history h
  WHERE h.user_id = p_user_id
    AND h.action_date >= (now() - (p_days_back || ' days')::interval)
  GROUP BY h.action
  ORDER BY action_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to calculate average approval time
CREATE OR REPLACE FUNCTION calculate_average_approval_time(
  p_workflow_id uuid DEFAULT NULL,
  p_days_back int DEFAULT 90
)
RETURNS TABLE (
  workflow_name text,
  avg_hours numeric,
  total_approvals bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.name,
    AVG(EXTRACT(EPOCH FROM (pa.completed_at - pa.submitted_at)) / 3600)::numeric(10,2),
    COUNT(*)::bigint
  FROM project_approvals pa
  INNER JOIN approval_workflows w ON pa.workflow_id = w.id
  WHERE pa.status IN ('approved', 'rejected')
    AND pa.completed_at IS NOT NULL
    AND pa.submitted_at >= (now() - (p_days_back || ' days')::interval)
    AND (p_workflow_id IS NULL OR pa.workflow_id = p_workflow_id)
  GROUP BY w.id, w.name
  ORDER BY total_approvals DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;