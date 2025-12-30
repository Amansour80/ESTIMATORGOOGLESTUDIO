/*
  # Fix Project Members Infinite Recursion with Helper Function
  
  1. Problem
    - INSERT policy checks project_members table to see if user is admin/manager
    - This creates infinite recursion when RLS evaluates the policy
  
  2. Solution
    - Create SECURITY DEFINER helper function to check membership outside RLS
    - Use this function in policies to avoid recursion
*/

-- Helper function to check if user is project admin/manager (bypasses RLS)
CREATE OR REPLACE FUNCTION is_project_admin_or_manager(p_project_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE retrofit_project_id = p_project_id
    AND user_id = p_user_id
    AND role IN ('admin', 'manager')
  );
END;
$$;

-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Project creators and admins can add members" ON project_members;
DROP POLICY IF EXISTS "Project creators and admins can update members" ON project_members;
DROP POLICY IF EXISTS "Project creators and admins can delete members" ON project_members;

-- New INSERT policy: Use helper function to avoid recursion
CREATE POLICY "Project creators and admins can add members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Super admin can add
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
    OR
    -- Project creator can add
    EXISTS (
      SELECT 1 FROM retrofit_projects rp
      WHERE rp.id = project_members.retrofit_project_id
      AND rp.user_id = auth.uid()
    )
    OR
    -- Existing project admin/manager can add (use helper function to break recursion)
    is_project_admin_or_manager(project_members.retrofit_project_id, auth.uid())
  );

-- New UPDATE policy
CREATE POLICY "Project creators and admins can update members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM retrofit_projects rp
      WHERE rp.id = project_members.retrofit_project_id
      AND rp.user_id = auth.uid()
    )
    OR
    is_project_admin_or_manager(project_members.retrofit_project_id, auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM retrofit_projects rp
      WHERE rp.id = project_members.retrofit_project_id
      AND rp.user_id = auth.uid()
    )
    OR
    is_project_admin_or_manager(project_members.retrofit_project_id, auth.uid())
  );

-- New DELETE policy
CREATE POLICY "Project creators and admins can delete members"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE super_admins.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM retrofit_projects rp
      WHERE rp.id = project_members.retrofit_project_id
      AND rp.user_id = auth.uid()
    )
    OR
    is_project_admin_or_manager(project_members.retrofit_project_id, auth.uid())
  );
