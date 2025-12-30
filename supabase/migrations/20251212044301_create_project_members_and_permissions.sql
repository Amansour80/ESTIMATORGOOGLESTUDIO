/*
  # Create Project Members and Permissions System
  
  1. New Tables
    - `project_members`: Links users to retrofit projects with roles
    - `project_permissions`: Defines what each role can do in each module
    
  2. Security
    - Enable RLS on both tables
    - Members can view their own membership
    - Only admins and managers can modify memberships
    - Permissions are read-only for most users
    
  3. Initial Data
    - Seed default permissions for all roles
*/

-- Create project_members table
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  retrofit_project_id uuid NOT NULL REFERENCES retrofit_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'engineer', 'planner', 'viewer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(retrofit_project_id, user_id)
);

-- Create project_permissions table
CREATE TABLE IF NOT EXISTS project_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'engineer', 'planner', 'viewer')),
  module text NOT NULL CHECK (module IN ('project', 'activities', 'documents', 'issues', 'members')),
  action text NOT NULL CHECK (action IN ('create', 'edit', 'delete', 'review', 'approve', 'view')),
  allowed boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, role, module, action)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_members_retrofit_project ON project_members(retrofit_project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_org ON project_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_permissions_lookup ON project_permissions(organization_id, role, module, action);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_members
CREATE POLICY "Users can view project members if they are members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_members.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can add project members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_members.retrofit_project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update project members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_members.retrofit_project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_members.retrofit_project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Only admins can delete project members"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_members.retrofit_project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
    )
  );

-- RLS Policies for project_permissions
CREATE POLICY "Anyone authenticated can view permissions"
  ON project_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only super admins can modify permissions"
  ON project_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
  );

-- Function to seed default permissions for an organization
CREATE OR REPLACE FUNCTION seed_project_permissions(org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admin: all permissions allowed
  INSERT INTO project_permissions (organization_id, role, module, action, allowed)
  SELECT org_id, 'admin', module, action, true
  FROM (
    VALUES 
      ('project', 'create'), ('project', 'edit'), ('project', 'delete'), ('project', 'view'),
      ('activities', 'create'), ('activities', 'edit'), ('activities', 'delete'), ('activities', 'view'),
      ('documents', 'create'), ('documents', 'edit'), ('documents', 'delete'), ('documents', 'review'), ('documents', 'approve'), ('documents', 'view'),
      ('issues', 'create'), ('issues', 'edit'), ('issues', 'delete'), ('issues', 'view'),
      ('members', 'create'), ('members', 'edit'), ('members', 'delete'), ('members', 'view')
  ) AS perms(module, action)
  ON CONFLICT (organization_id, role, module, action) DO NOTHING;

  -- Manager: all except delete members
  INSERT INTO project_permissions (organization_id, role, module, action, allowed)
  SELECT org_id, 'manager', module, action, true
  FROM (
    VALUES 
      ('project', 'create'), ('project', 'edit'), ('project', 'view'),
      ('activities', 'create'), ('activities', 'edit'), ('activities', 'delete'), ('activities', 'view'),
      ('documents', 'create'), ('documents', 'edit'), ('documents', 'delete'), ('documents', 'review'), ('documents', 'approve'), ('documents', 'view'),
      ('issues', 'create'), ('issues', 'edit'), ('issues', 'delete'), ('issues', 'view'),
      ('members', 'create'), ('members', 'edit'), ('members', 'view')
  ) AS perms(module, action)
  ON CONFLICT (organization_id, role, module, action) DO NOTHING;

  -- Engineer: create/edit activities and issues, review documents (no approve)
  INSERT INTO project_permissions (organization_id, role, module, action, allowed)
  SELECT org_id, 'engineer', module, action, true
  FROM (
    VALUES 
      ('project', 'view'),
      ('activities', 'create'), ('activities', 'edit'), ('activities', 'view'),
      ('documents', 'create'), ('documents', 'review'), ('documents', 'view'),
      ('issues', 'create'), ('issues', 'edit'), ('issues', 'view'),
      ('members', 'view')
  ) AS perms(module, action)
  ON CONFLICT (organization_id, role, module, action) DO NOTHING;

  -- Planner: edit schedule/progress, view docs/issues
  INSERT INTO project_permissions (organization_id, role, module, action, allowed)
  SELECT org_id, 'planner', module, action, true
  FROM (
    VALUES 
      ('project', 'view'),
      ('activities', 'edit'), ('activities', 'view'),
      ('documents', 'view'),
      ('issues', 'view'),
      ('members', 'view')
  ) AS perms(module, action)
  ON CONFLICT (organization_id, role, module, action) DO NOTHING;

  -- Viewer: view only
  INSERT INTO project_permissions (organization_id, role, module, action, allowed)
  SELECT org_id, 'viewer', module, action, true
  FROM (
    VALUES 
      ('project', 'view'),
      ('activities', 'view'),
      ('documents', 'view'),
      ('issues', 'view'),
      ('members', 'view')
  ) AS perms(module, action)
  ON CONFLICT (organization_id, role, module, action) DO NOTHING;
END;
$$;

-- Seed permissions for all existing organizations
DO $$
DECLARE
  org RECORD;
BEGIN
  FOR org IN SELECT id FROM organizations LOOP
    PERFORM seed_project_permissions(org.id);
  END LOOP;
END $$;

-- Trigger to automatically seed permissions for new organizations
CREATE OR REPLACE FUNCTION auto_seed_project_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM seed_project_permissions(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_auto_seed_project_permissions
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION auto_seed_project_permissions();

-- Helper function to check if user has permission
CREATE OR REPLACE FUNCTION has_project_permission(
  p_user_id uuid,
  p_retrofit_project_id uuid,
  p_module text,
  p_action text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  org_id uuid;
  has_perm boolean;
BEGIN
  -- Get user's role in this project
  SELECT pm.role, pm.organization_id INTO user_role, org_id
  FROM project_members pm
  WHERE pm.user_id = p_user_id
  AND pm.retrofit_project_id = p_retrofit_project_id;

  -- If not a member, no permission
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Check permission
  SELECT pp.allowed INTO has_perm
  FROM project_permissions pp
  WHERE pp.organization_id = org_id
  AND pp.role = user_role
  AND pp.module = p_module
  AND pp.action = p_action;

  RETURN COALESCE(has_perm, false);
END;
$$;