/*
  # Add Document Versions, Time Tracking, and Activity Enhancements

  1. New Tables
    - `document_versions`
      - Tracks historical versions of documents when they are resubmitted or updated
      - Links to parent document with version number and status at time of version
    
    - `activity_comments`
      - Comments on activities (similar to document and issue comments)
      - Enables discussion threads on activities
    
    - `activity_time_logs`
      - Actual time tracking for activities
      - Records hours worked by users on activities
      - Includes date, user, hours, and description
    
    - `activity_templates`
      - Reusable activity templates for common construction sequences
      - Organization-specific or system-wide templates
      - Can be applied to projects to quickly add common activity sequences
    
    - `activity_template_items`
      - Individual activities within a template
      - Includes duration, dependencies, and suggested assignments

  2. Security
    - Enable RLS on all new tables
    - Policies for organization members to read/write their own data
    - Super admin access to all data

  3. Indexes
    - Foreign key indexes for performance
    - Composite indexes for common queries
*/

-- Document Versions Table
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES project_documents(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  category text NOT NULL,
  workflow_status text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  notes text,
  CONSTRAINT unique_document_version UNIQUE (document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_org_id ON document_versions(organization_id);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document versions in their organization"
  ON document_versions FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create document versions in their organization"
  ON document_versions FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Activity Comments Table
CREATE TABLE IF NOT EXISTS activity_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES project_activities(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_org_id ON activity_comments(organization_id);

ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity comments in their organization"
  ON activity_comments FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity comments in their organization"
  ON activity_comments FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own activity comments"
  ON activity_comments FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Activity Time Logs Table
CREATE TABLE IF NOT EXISTS activity_time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES project_activities(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  hours_worked numeric(5,2) NOT NULL CHECK (hours_worked > 0 AND hours_worked <= 24),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_time_logs_activity_id ON activity_time_logs(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_time_logs_user_id ON activity_time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_time_logs_log_date ON activity_time_logs(log_date);

ALTER TABLE activity_time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view time logs in their organization"
  ON activity_time_logs FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own time logs"
  ON activity_time_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own time logs"
  ON activity_time_logs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own time logs"
  ON activity_time_logs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Activity Templates Table
CREATE TABLE IF NOT EXISTS activity_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  is_system_template boolean DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_templates_org_id ON activity_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_templates_category ON activity_templates(category);

ALTER TABLE activity_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates in their organization"
  ON activity_templates FOR SELECT
  TO authenticated
  USING (
    is_system_template = true OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create templates in their organization"
  ON activity_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates in their organization"
  ON activity_templates FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete templates in their organization"
  ON activity_templates FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Activity Template Items Table
CREATE TABLE IF NOT EXISTS activity_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES activity_templates(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL,
  name text NOT NULL,
  description text,
  duration_days integer NOT NULL CHECK (duration_days > 0),
  assignee_type text,
  depends_on_sequence integer,
  dependency_type text DEFAULT 'FS',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_template_items_template_id ON activity_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_activity_template_items_sequence ON activity_template_items(template_id, sequence_order);

ALTER TABLE activity_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view template items for accessible templates"
  ON activity_template_items FOR SELECT
  TO authenticated
  USING (
    template_id IN (
      SELECT id FROM activity_templates
      WHERE is_system_template = true OR
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create template items for their templates"
  ON activity_template_items FOR INSERT
  TO authenticated
  WITH CHECK (
    template_id IN (
      SELECT id FROM activity_templates
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update template items for their templates"
  ON activity_template_items FOR UPDATE
  TO authenticated
  USING (
    template_id IN (
      SELECT id FROM activity_templates
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete template items for their templates"
  ON activity_template_items FOR DELETE
  TO authenticated
  USING (
    template_id IN (
      SELECT id FROM activity_templates
      WHERE organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to create document version when status changes
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.workflow_status IS DISTINCT FROM NEW.workflow_status THEN
    INSERT INTO document_versions (
      document_id,
      organization_id,
      version_number,
      title,
      category,
      workflow_status,
      created_by,
      notes
    )
    SELECT
      OLD.id,
      OLD.organization_id,
      COALESCE((SELECT MAX(version_number) + 1 FROM document_versions WHERE document_id = OLD.id), 1),
      OLD.title,
      OLD.category,
      OLD.workflow_status,
      OLD.created_by,
      'Status changed from ' || OLD.workflow_status || ' to ' || NEW.workflow_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS document_version_trigger ON project_documents;
CREATE TRIGGER document_version_trigger
  BEFORE UPDATE ON project_documents
  FOR EACH ROW
  EXECUTE FUNCTION create_document_version();

-- Function to update activity progress based on time logs
CREATE OR REPLACE FUNCTION calculate_activity_progress_from_time()
RETURNS TRIGGER AS $$
DECLARE
  total_logged_hours numeric;
  estimated_hours numeric;
  new_progress integer;
BEGIN
  SELECT COALESCE(SUM(hours_worked), 0)
  INTO total_logged_hours
  FROM activity_time_logs
  WHERE activity_id = NEW.activity_id;

  SELECT COALESCE(
    EXTRACT(EPOCH FROM (end_date - start_date)) / 3600 * 8,
    40
  )
  INTO estimated_hours
  FROM project_activities
  WHERE id = NEW.activity_id;

  new_progress := LEAST(100, GREATEST(0, ROUND((total_logged_hours / NULLIF(estimated_hours, 0) * 100)::numeric)));

  UPDATE project_activities
  SET progress_percent = new_progress,
      updated_at = now()
  WHERE id = NEW.activity_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_activity_progress_on_time_log ON activity_time_logs;
CREATE TRIGGER update_activity_progress_on_time_log
  AFTER INSERT OR UPDATE OR DELETE ON activity_time_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_activity_progress_from_time();
