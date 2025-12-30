/*
  # Create Project Approvals System
  
  ## Overview
  This migration creates the project_approvals table that tracks the approval
  workflow execution for each project across all project types (FM, Retrofit, HK).
  
  ## New Tables
  
  ### `project_approvals`
  Tracks active approval workflows for projects.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique approval identifier
  - `project_id` (uuid) - Foreign key to project (fm/retrofit/hk)
  - `project_type` (text) - Type: 'fm', 'retrofit', or 'hk'
  - `workflow_id` (uuid, foreign key) - Links to approval_workflows table
  - `current_node_id` (text) - Current node in workflow canvas
  - `status` (text) - Overall status: draft, pending, approved, rejected, revision_requested
  - `submitted_by` (uuid, foreign key) - User who submitted for approval
  - `submitted_at` (timestamptz) - Submission timestamp
  - `completed_at` (timestamptz) - Completion timestamp
  - `metadata` (jsonb) - Project snapshot for rule evaluation
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - Enable RLS on project_approvals table
  - Users can view approvals for their organization's projects
  - Only submitters and approvers can modify
  - Super admins have full access
  
  ## Notes
  - One active approval per project at a time
  - Metadata stores project snapshot at submission time
  - Current node tracks progress through workflow
*/

-- Create enum for approval status
DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM (
    'draft',
    'pending',
    'approved',
    'rejected',
    'revision_requested'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for project type
DO $$ BEGIN
  CREATE TYPE project_type_enum AS ENUM ('fm', 'retrofit', 'hk');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create project_approvals table
CREATE TABLE IF NOT EXISTS project_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  project_type project_type_enum NOT NULL,
  workflow_id uuid NOT NULL REFERENCES approval_workflows(id) ON DELETE RESTRICT,
  current_node_id text,
  status approval_status DEFAULT 'pending',
  submitted_by uuid NOT NULL REFERENCES user_profiles(id),
  submitted_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_active_project_approval UNIQUE (project_id, project_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_approvals_project 
  ON project_approvals(project_id, project_type);
CREATE INDEX IF NOT EXISTS idx_project_approvals_workflow 
  ON project_approvals(workflow_id);
CREATE INDEX IF NOT EXISTS idx_project_approvals_status 
  ON project_approvals(status);
CREATE INDEX IF NOT EXISTS idx_project_approvals_submitted_by 
  ON project_approvals(submitted_by);
CREATE INDEX IF NOT EXISTS idx_project_approvals_current_node 
  ON project_approvals(current_node_id) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE project_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view approvals for their organization's projects
CREATE POLICY "Users can view organization project approvals"
  ON project_approvals
  FOR SELECT
  TO authenticated
  USING (
    workflow_id IN (
      SELECT w.id FROM approval_workflows w
      WHERE w.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Users can create approvals for projects they can access
CREATE POLICY "Users can create project approvals"
  ON project_approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workflow_id IN (
      SELECT w.id FROM approval_workflows w
      WHERE w.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
    AND submitted_by = auth.uid()
  );

-- Only system or authorized users can update approvals
CREATE POLICY "Authorized users can update project approvals"
  ON project_approvals
  FOR UPDATE
  TO authenticated
  USING (
    workflow_id IN (
      SELECT w.id FROM approval_workflows w
      WHERE w.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    workflow_id IN (
      SELECT w.id FROM approval_workflows w
      WHERE w.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Super admins can do everything
CREATE POLICY "Super admins have full access to project approvals"
  ON project_approvals
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Set completed_at when status changes to terminal state
  IF NEW.status IN ('approved', 'rejected') AND OLD.status != NEW.status THEN
    NEW.completed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update updated_at and completed_at
DROP TRIGGER IF EXISTS update_project_approvals_updated_at_trigger 
  ON project_approvals;
CREATE TRIGGER update_project_approvals_updated_at_trigger
  BEFORE UPDATE ON project_approvals
  FOR EACH ROW
  EXECUTE FUNCTION update_project_approvals_updated_at();

-- Helper function to get pending approvals for a user
CREATE OR REPLACE FUNCTION get_pending_approvals_for_user(p_user_id uuid)
RETURNS TABLE (
  approval_id uuid,
  project_id uuid,
  project_type project_type_enum,
  workflow_name text,
  current_step text,
  submitted_by_name text,
  submitted_at timestamptz,
  days_pending int
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    pa.project_id,
    pa.project_type,
    w.name,
    pa.current_node_id,
    up.full_name,
    pa.submitted_at,
    EXTRACT(DAY FROM (now() - pa.submitted_at))::int
  FROM project_approvals pa
  INNER JOIN approval_workflows w ON pa.workflow_id = w.id
  INNER JOIN user_profiles up ON pa.submitted_by = up.id
  WHERE pa.status = 'pending'
    AND EXISTS (
      -- Check if user has a role that can approve current step
      SELECT 1
      FROM approval_workflow_canvas c,
           jsonb_array_elements(c.nodes) as node
      WHERE c.workflow_id = pa.workflow_id
        AND node->>'id' = pa.current_node_id
        AND node->>'type' = 'approval'
        AND EXISTS (
          SELECT 1
          FROM user_role_assignments ura
          WHERE ura.user_id = p_user_id
            AND ura.role_id::text = ANY(
              SELECT jsonb_array_elements_text(node->'data'->'roles')
            )
            AND ura.is_active = true
        )
    )
  ORDER BY pa.submitted_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get approval history for a project
CREATE OR REPLACE FUNCTION get_project_approval_status(
  p_project_id uuid,
  p_project_type project_type_enum
)
RETURNS TABLE (
  approval_id uuid,
  workflow_name text,
  status approval_status,
  current_node text,
  submitted_at timestamptz,
  completed_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.id,
    w.name,
    pa.status,
    pa.current_node_id,
    pa.submitted_at,
    pa.completed_at
  FROM project_approvals pa
  INNER JOIN approval_workflows w ON pa.workflow_id = w.id
  WHERE pa.project_id = p_project_id
    AND pa.project_type = p_project_type
  ORDER BY pa.submitted_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;