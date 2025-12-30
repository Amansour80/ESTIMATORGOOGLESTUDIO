/*
  # Create Issues/RFIs System and Audit Log
  
  1. New Tables
    - `project_issues`: Issues, RFIs, and snags tracking
    - `issue_comments`: Comments on issues
    - `audit_log`: Comprehensive change tracking
    
  2. Security
    - Enable RLS on all tables
    - Access based on project membership
    - Action permissions checked
    
  3. Features
    - Priority and status tracking
    - Linkage to activities and documents
    - Assignment tracking
    - Full audit trail for all entities
*/

-- Create project_issues table
CREATE TABLE IF NOT EXISTS project_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  retrofit_project_id uuid NOT NULL REFERENCES retrofit_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
  status text DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  due_date date,
  linked_activity_id uuid REFERENCES project_activities(id) ON DELETE SET NULL,
  linked_document_id uuid REFERENCES project_documents(id) ON DELETE SET NULL,
  assigned_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create issue_comments table
CREATE TABLE IF NOT EXISTS issue_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  issue_id uuid NOT NULL REFERENCES project_issues(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('document', 'activity', 'issue', 'project', 'member')),
  entity_id uuid NOT NULL,
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_issues_project ON project_issues(retrofit_project_id);
CREATE INDEX IF NOT EXISTS idx_project_issues_status ON project_issues(status);
CREATE INDEX IF NOT EXISTS idx_project_issues_priority ON project_issues(priority);
CREATE INDEX IF NOT EXISTS idx_project_issues_assignee ON project_issues(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_project_issues_activity ON project_issues(linked_activity_id);
CREATE INDEX IF NOT EXISTS idx_project_issues_document ON project_issues(linked_document_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE project_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_issues
CREATE POLICY "Members can view project issues"
  ON project_issues FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_issues.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members with create permission can add issues"
  ON project_issues FOR INSERT
  TO authenticated
  WITH CHECK (
    has_project_permission(auth.uid(), retrofit_project_id, 'issues', 'create')
  );

CREATE POLICY "Members with edit permission can update issues"
  ON project_issues FOR UPDATE
  TO authenticated
  USING (
    has_project_permission(auth.uid(), retrofit_project_id, 'issues', 'edit')
  )
  WITH CHECK (
    has_project_permission(auth.uid(), retrofit_project_id, 'issues', 'edit')
  );

CREATE POLICY "Members with delete permission can remove issues"
  ON project_issues FOR DELETE
  TO authenticated
  USING (
    has_project_permission(auth.uid(), retrofit_project_id, 'issues', 'delete')
  );

-- RLS Policies for issue_comments
CREATE POLICY "Members can view issue comments"
  ON issue_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_issues pi
      JOIN project_members pm ON pm.retrofit_project_id = pi.retrofit_project_id
      WHERE pi.id = issue_comments.issue_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add issue comments"
  ON issue_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_issues pi
      JOIN project_members pm ON pm.retrofit_project_id = pi.retrofit_project_id
      WHERE pi.id = issue_comments.issue_id
      AND pm.user_id = auth.uid()
    )
  );

-- RLS Policies for audit_log
CREATE POLICY "Members can view audit logs for their projects"
  ON audit_log FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM project_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to log audit entries
CREATE OR REPLACE FUNCTION log_audit(
  p_organization_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action text,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_id uuid;
BEGIN
  INSERT INTO audit_log (
    organization_id,
    entity_type,
    entity_id,
    action,
    old_value,
    new_value,
    created_by
  ) VALUES (
    p_organization_id,
    p_entity_type,
    p_entity_id,
    p_action,
    p_old_value,
    p_new_value,
    auth.uid()
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;