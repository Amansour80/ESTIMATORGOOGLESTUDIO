/*
  # Create Project Activities and Dependencies
  
  1. New Tables
    - `project_activities`: Tasks/activities in a retrofit project
    - `activity_dependencies`: Defines predecessor/successor relationships
    
  2. Security
    - Enable RLS on both tables
    - Users can view activities if they're project members
    - Create/edit/delete based on project permissions
    
  3. Features
    - Progress tracking (0-100%)
    - Status workflow
    - Assignee tracking
    - Dependency management with circular prevention
*/

-- Create project_activities table
CREATE TABLE IF NOT EXISTS project_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  retrofit_project_id uuid NOT NULL REFERENCES retrofit_projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  progress_percent int DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  status text DEFAULT 'Pending' CHECK (status IN ('Pending', 'Work in Progress', 'Ready for Inspection', 'Awaiting Client Approval', 'Inspected', 'Closed')),
  assignee_type text CHECK (assignee_type IN ('employee', 'client_rep', 'consultant')),
  assignee_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create activity_dependencies table
CREATE TABLE IF NOT EXISTS activity_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  retrofit_project_id uuid NOT NULL REFERENCES retrofit_projects(id) ON DELETE CASCADE,
  predecessor_activity_id uuid NOT NULL REFERENCES project_activities(id) ON DELETE CASCADE,
  successor_activity_id uuid NOT NULL REFERENCES project_activities(id) ON DELETE CASCADE,
  type text DEFAULT 'FS' CHECK (type IN ('FS', 'SS', 'FF', 'SF')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT no_self_dependency CHECK (predecessor_activity_id != successor_activity_id),
  UNIQUE(predecessor_activity_id, successor_activity_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_activities_project ON project_activities(retrofit_project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_org ON project_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_status ON project_activities(status);
CREATE INDEX IF NOT EXISTS idx_project_activities_assignee ON project_activities(assignee_user_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_dates ON project_activities(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_activity_dependencies_project ON activity_dependencies(retrofit_project_id);
CREATE INDEX IF NOT EXISTS idx_activity_dependencies_predecessor ON activity_dependencies(predecessor_activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_dependencies_successor ON activity_dependencies(successor_activity_id);

-- Enable RLS
ALTER TABLE project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_activities
CREATE POLICY "Members can view project activities"
  ON project_activities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_activities.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members with create permission can add activities"
  ON project_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    has_project_permission(auth.uid(), retrofit_project_id, 'activities', 'create')
  );

CREATE POLICY "Members with edit permission can update activities"
  ON project_activities FOR UPDATE
  TO authenticated
  USING (
    has_project_permission(auth.uid(), retrofit_project_id, 'activities', 'edit')
  )
  WITH CHECK (
    has_project_permission(auth.uid(), retrofit_project_id, 'activities', 'edit')
  );

CREATE POLICY "Members with delete permission can remove activities"
  ON project_activities FOR DELETE
  TO authenticated
  USING (
    has_project_permission(auth.uid(), retrofit_project_id, 'activities', 'delete')
  );

-- RLS Policies for activity_dependencies
CREATE POLICY "Members can view activity dependencies"
  ON activity_dependencies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = activity_dependencies.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Members with edit permission can add dependencies"
  ON activity_dependencies FOR INSERT
  TO authenticated
  WITH CHECK (
    has_project_permission(auth.uid(), retrofit_project_id, 'activities', 'edit')
  );

CREATE POLICY "Members with edit permission can remove dependencies"
  ON activity_dependencies FOR DELETE
  TO authenticated
  USING (
    has_project_permission(auth.uid(), retrofit_project_id, 'activities', 'edit')
  );

-- Function to check for circular dependencies
CREATE OR REPLACE FUNCTION check_circular_dependency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if adding this dependency would create a cycle
  IF EXISTS (
    WITH RECURSIVE dep_chain AS (
      -- Start with the new successor
      SELECT NEW.successor_activity_id AS activity_id, 1 AS depth
      UNION ALL
      -- Follow the chain
      SELECT ad.successor_activity_id, dc.depth + 1
      FROM activity_dependencies ad
      JOIN dep_chain dc ON ad.predecessor_activity_id = dc.activity_id
      WHERE dc.depth < 100  -- Prevent infinite loops
    )
    SELECT 1 FROM dep_chain
    WHERE activity_id = NEW.predecessor_activity_id
  ) THEN
    RAISE EXCEPTION 'Circular dependency detected';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_circular_dependencies
  BEFORE INSERT ON activity_dependencies
  FOR EACH ROW
  EXECUTE FUNCTION check_circular_dependency();

-- Function to update project forecast and progress
CREATE OR REPLACE FUNCTION update_project_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_end date;
  avg_progress int;
BEGIN
  -- Calculate forecast end date (max of all activity end dates)
  SELECT MAX(end_date), ROUND(AVG(progress_percent))
  INTO max_end, avg_progress
  FROM project_activities
  WHERE retrofit_project_id = COALESCE(NEW.retrofit_project_id, OLD.retrofit_project_id);
  
  -- Update the project
  UPDATE retrofit_projects
  SET 
    forecast_end_date = max_end,
    overall_progress = COALESCE(avg_progress, 0),
    updated_at = now()
  WHERE id = COALESCE(NEW.retrofit_project_id, OLD.retrofit_project_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trigger_update_project_metrics_on_activity
  AFTER INSERT OR UPDATE OR DELETE ON project_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_project_metrics();