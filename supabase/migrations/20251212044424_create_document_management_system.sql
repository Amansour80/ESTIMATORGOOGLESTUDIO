/*
  # Create Document Management and Workflow System
  
  1. New Tables
    - `project_documents`: Document records with workflow status
    - `document_versions`: Version history for each document
    - `document_workflow_steps`: Approval workflow steps
    - `document_comments`: Comments and discussions
    
  2. Security
    - Enable RLS on all tables
    - Access based on project membership
    - Workflow actions based on permissions
    
  3. Features
    - Multi-version document support
    - Configurable approval workflows
    - Comment threading
    - Activity linkage
*/

-- Create project_documents table
CREATE TABLE IF NOT EXISTS project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  retrofit_project_id uuid NOT NULL REFERENCES retrofit_projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('Drawings', 'Material Submittal', 'Method Statement', 'Inspection', 'Handover', 'Other')),
  linked_activity_id uuid REFERENCES project_activities(id) ON DELETE SET NULL,
  current_version_id uuid,
  workflow_status text DEFAULT 'Draft' CHECK (workflow_status IN ('Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Resubmitted')),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES project_documents(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  file_url text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(document_id, version_number)
);

-- Add foreign key for current_version_id after document_versions is created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'project_documents_current_version_id_fkey'
  ) THEN
    ALTER TABLE project_documents
    ADD CONSTRAINT project_documents_current_version_id_fkey
    FOREIGN KEY (current_version_id) REFERENCES document_versions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create document_workflow_steps table
CREATE TABLE IF NOT EXISTS document_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES project_documents(id) ON DELETE CASCADE,
  step_order int NOT NULL,
  step_type text NOT NULL CHECK (step_type IN ('internal_review', 'consultant_review', 'client_approval')),
  is_optional boolean DEFAULT false,
  assigned_to_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date date,
  decision text DEFAULT 'Pending' CHECK (decision IN ('Pending', 'Approved', 'Rejected', 'Revision Requested')),
  decision_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_at timestamptz,
  decision_notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(document_id, step_order)
);

-- Create document_comments table
CREATE TABLE IF NOT EXISTS document_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES project_documents(id) ON DELETE CASCADE,
  version_id uuid REFERENCES document_versions(id) ON DELETE SET NULL,
  comment text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_documents_project ON project_documents(retrofit_project_id);
CREATE INDEX IF NOT EXISTS idx_project_documents_status ON project_documents(workflow_status);
CREATE INDEX IF NOT EXISTS idx_project_documents_category ON project_documents(category);
CREATE INDEX IF NOT EXISTS idx_project_documents_activity ON project_documents(linked_activity_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_workflow_steps_document ON document_workflow_steps(document_id);
CREATE INDEX IF NOT EXISTS idx_document_workflow_steps_assignee ON document_workflow_steps(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_document ON document_comments(document_id);

-- Enable RLS
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_documents
CREATE POLICY "Members can view project documents"
  ON project_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_documents.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members with create permission can add documents"
  ON project_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    has_project_permission(auth.uid(), retrofit_project_id, 'documents', 'create')
  );

CREATE POLICY "Members with edit permission can update documents"
  ON project_documents FOR UPDATE
  TO authenticated
  USING (
    has_project_permission(auth.uid(), retrofit_project_id, 'documents', 'edit')
  )
  WITH CHECK (
    has_project_permission(auth.uid(), retrofit_project_id, 'documents', 'edit')
  );

CREATE POLICY "Members with delete permission can remove documents"
  ON project_documents FOR DELETE
  TO authenticated
  USING (
    has_project_permission(auth.uid(), retrofit_project_id, 'documents', 'delete')
  );

-- RLS Policies for document_versions
CREATE POLICY "Members can view document versions"
  ON document_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_documents pd
      JOIN project_members pm ON pm.retrofit_project_id = pd.retrofit_project_id
      WHERE pd.id = document_versions.document_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members with create permission can add versions"
  ON document_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_documents pd
      WHERE pd.id = document_versions.document_id
      AND has_project_permission(auth.uid(), pd.retrofit_project_id, 'documents', 'create')
    )
  );

-- RLS Policies for document_workflow_steps
CREATE POLICY "Members can view workflow steps"
  ON document_workflow_steps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_documents pd
      JOIN project_members pm ON pm.retrofit_project_id = pd.retrofit_project_id
      WHERE pd.id = document_workflow_steps.document_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members with edit permission can manage workflow steps"
  ON document_workflow_steps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_documents pd
      WHERE pd.id = document_workflow_steps.document_id
      AND has_project_permission(auth.uid(), pd.retrofit_project_id, 'documents', 'edit')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_documents pd
      WHERE pd.id = document_workflow_steps.document_id
      AND has_project_permission(auth.uid(), pd.retrofit_project_id, 'documents', 'edit')
    )
  );

-- RLS Policies for document_comments
CREATE POLICY "Members can view document comments"
  ON document_comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_documents pd
      JOIN project_members pm ON pm.retrofit_project_id = pd.retrofit_project_id
      WHERE pd.id = document_comments.document_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members can add comments"
  ON document_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_documents pd
      JOIN project_members pm ON pm.retrofit_project_id = pd.retrofit_project_id
      WHERE pd.id = document_comments.document_id
      AND pm.user_id = auth.uid()
    )
  );

-- Function to create default workflow steps when document is submitted
CREATE OR REPLACE FUNCTION create_default_workflow_steps()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create steps when status changes from Draft to Submitted
  IF OLD.workflow_status = 'Draft' AND NEW.workflow_status = 'Submitted' THEN
    -- Create internal review step (required)
    INSERT INTO document_workflow_steps (
      organization_id,
      document_id,
      step_order,
      step_type,
      is_optional
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      1,
      'internal_review',
      false
    );
    
    -- Create consultant review step (optional)
    INSERT INTO document_workflow_steps (
      organization_id,
      document_id,
      step_order,
      step_type,
      is_optional
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      2,
      'consultant_review',
      true
    );
    
    -- Create client approval step (optional)
    INSERT INTO document_workflow_steps (
      organization_id,
      document_id,
      step_order,
      step_type,
      is_optional
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      3,
      'client_approval',
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_default_workflow_steps
  AFTER UPDATE ON project_documents
  FOR EACH ROW
  WHEN (OLD.workflow_status IS DISTINCT FROM NEW.workflow_status)
  EXECUTE FUNCTION create_default_workflow_steps();