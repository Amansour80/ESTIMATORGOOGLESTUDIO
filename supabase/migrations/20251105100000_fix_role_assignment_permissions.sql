/*
  # Fix Role Assignment Permissions

  ## Overview
  This migration updates the RLS policies for user_role_assignments to allow
  users with can_manage_roles permission to assign roles, not just org admins.

  ## Changes
  - Drop and recreate INSERT policy to check for can_manage_roles permission
  - Drop and recreate UPDATE policy to check for can_manage_roles permission
  - Drop and recreate DELETE policy to check for can_manage_roles permission

  ## Security
  - Users with can_manage_roles permission can now assign roles
  - Organization admins (owner/admin role) can still assign roles
  - Super admins can still assign roles

  ## Notes
  - This allows more granular permission control
  - Users must still be members of the organization to be assigned roles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can create role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins can update role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins can delete role assignments" ON user_role_assignments;

-- Recreate INSERT policy with can_manage_roles check
CREATE POLICY "Admins and role managers can create role assignments"
  ON user_role_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is org owner/admin
    (organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    ))
    OR
    -- User has can_manage_roles permission
    (EXISTS (
      SELECT 1
      FROM user_role_assignments ura
      INNER JOIN organization_roles r ON ura.role_id = r.id
      WHERE ura.user_id = auth.uid()
        AND ura.organization_id = user_role_assignments.organization_id
        AND ura.is_active = true
        AND r.is_active = true
        AND (r.permissions->>'can_manage_roles')::boolean = true
    ))
    -- And the target user must be in the organization
    AND user_id IN (
      SELECT user_id
      FROM organization_members
      WHERE organization_id = user_role_assignments.organization_id
    )
  );

-- Recreate UPDATE policy with can_manage_roles check
CREATE POLICY "Admins and role managers can update role assignments"
  ON user_role_assignments
  FOR UPDATE
  TO authenticated
  USING (
    (organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    ))
    OR
    (EXISTS (
      SELECT 1
      FROM user_role_assignments ura
      INNER JOIN organization_roles r ON ura.role_id = r.id
      WHERE ura.user_id = auth.uid()
        AND ura.organization_id = user_role_assignments.organization_id
        AND ura.is_active = true
        AND r.is_active = true
        AND (r.permissions->>'can_manage_roles')::boolean = true
    ))
  )
  WITH CHECK (
    (organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    ))
    OR
    (EXISTS (
      SELECT 1
      FROM user_role_assignments ura
      INNER JOIN organization_roles r ON ura.role_id = r.id
      WHERE ura.user_id = auth.uid()
        AND ura.organization_id = user_role_assignments.organization_id
        AND ura.is_active = true
        AND r.is_active = true
        AND (r.permissions->>'can_manage_roles')::boolean = true
    ))
  );

-- Recreate DELETE policy with can_manage_roles check
CREATE POLICY "Admins and role managers can delete role assignments"
  ON user_role_assignments
  FOR DELETE
  TO authenticated
  USING (
    (organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    ))
    OR
    (EXISTS (
      SELECT 1
      FROM user_role_assignments ura
      INNER JOIN organization_roles r ON ura.role_id = r.id
      WHERE ura.user_id = auth.uid()
        AND ura.organization_id = user_role_assignments.organization_id
        AND ura.is_active = true
        AND r.is_active = true
        AND (r.permissions->>'can_manage_roles')::boolean = true
    ))
  );
