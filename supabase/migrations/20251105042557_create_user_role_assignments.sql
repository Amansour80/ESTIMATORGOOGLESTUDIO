/*
  # Create User Role Assignments System
  
  ## Overview
  This migration creates the user_role_assignments table that links users to their custom
  approval roles within organizations. Users can have multiple roles for approval workflows.
  
  ## New Tables
  
  ### `user_role_assignments`
  Links users to their approval workflow roles within an organization.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique assignment identifier
  - `organization_id` (uuid, foreign key) - Links to organizations table
  - `user_id` (uuid, foreign key) - Links to user_profiles table
  - `role_id` (uuid, foreign key) - Links to organization_roles table
  - `assigned_by` (uuid, foreign key) - User who made the assignment
  - `assigned_at` (timestamptz) - When assignment was made
  - `is_active` (boolean) - Whether assignment is currently active
  
  ## Security
  - Enable RLS on user_role_assignments table
  - Users can view their own role assignments
  - Organization admins can view all assignments in their organization
  - Only admins can create/update/delete role assignments
  
  ## Notes
  - A user can have multiple approval roles
  - Assignments are organization-specific
  - Inactive assignments are kept for audit trail
*/

-- Create user_role_assignments table
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES organization_roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES user_profiles(id),
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  
  -- Constraints
  CONSTRAINT unique_user_role_assignment UNIQUE (organization_id, user_id, role_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_org_id 
  ON user_role_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_id 
  ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role_id 
  ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_active 
  ON user_role_assignments(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user_org 
  ON user_role_assignments(user_id, organization_id) WHERE is_active = true;

-- Enable RLS
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own role assignments
CREATE POLICY "Users can view their own role assignments"
  ON user_role_assignments
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  );

-- Admins can create role assignments for their organization
CREATE POLICY "Admins can create role assignments"
  ON user_role_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
    AND user_id IN (
      SELECT user_id 
      FROM organization_members 
      WHERE organization_id = user_role_assignments.organization_id
    )
  );

-- Admins can update role assignments in their organization
CREATE POLICY "Admins can update role assignments"
  ON user_role_assignments
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  );

-- Admins can delete role assignments in their organization
CREATE POLICY "Admins can delete role assignments"
  ON user_role_assignments
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() 
        AND role IN ('owner', 'admin')
    )
  );

-- Super admins can do everything
CREATE POLICY "Super admins have full access to role assignments"
  ON user_role_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Helper function to get user's approval roles in an organization
CREATE OR REPLACE FUNCTION get_user_approval_roles(p_user_id uuid, p_org_id uuid)
RETURNS TABLE (
  role_id uuid,
  role_name text,
  role_type role_type,
  permissions jsonb,
  color text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.role_name,
    r.role_type,
    r.permissions,
    r.color
  FROM organization_roles r
  INNER JOIN user_role_assignments ura 
    ON r.id = ura.role_id
  WHERE ura.user_id = p_user_id
    AND ura.organization_id = p_org_id
    AND ura.is_active = true
    AND r.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_approval_permission(
  p_user_id uuid,
  p_org_id uuid,
  p_permission text
)
RETURNS boolean AS $$
DECLARE
  has_permission boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM user_role_assignments ura
    INNER JOIN organization_roles r ON ura.role_id = r.id
    WHERE ura.user_id = p_user_id
      AND ura.organization_id = p_org_id
      AND ura.is_active = true
      AND r.is_active = true
      AND (r.permissions->p_permission)::boolean = true
  ) INTO has_permission;
  
  RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get all users with a specific role in an organization
CREATE OR REPLACE FUNCTION get_users_with_role(
  p_org_id uuid,
  p_role_id uuid
)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name
  FROM user_profiles up
  INNER JOIN user_role_assignments ura 
    ON up.id = ura.user_id
  WHERE ura.organization_id = p_org_id
    AND ura.role_id = p_role_id
    AND ura.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;