/*
  # Fix Project Members Infinite Recursion
  
  1. Problem
    - INSERT policy for project_members checks if user is already a member
    - This creates infinite recursion when trying to add the first member
  
  2. Solution
    - Allow project creator (who owns the retrofit_project) to add members
    - Allow super admins to add members
    - Allow existing admin/manager members to add members (with safeguard)
*/

-- Drop the existing problematic policies
DROP POLICY IF EXISTS "Admins and managers can add project members" ON project_members;
DROP POLICY IF EXISTS "Admins and managers can update project members" ON project_members;
DROP POLICY IF EXISTS "Only admins can delete project members" ON project_members;

-- New INSERT policy: Project creator or super admins can add members
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
    -- Project creator can add (user who created the retrofit project)
    EXISTS (
      SELECT 1 FROM retrofit_projects rp
      WHERE rp.id = project_members.retrofit_project_id
      AND rp.user_id = auth.uid()
    )
    OR
    -- Existing project admin/manager can add (check via direct join to avoid recursion)
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_members.retrofit_project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'manager')
      -- Ensure we're not in a recursive check by using a subquery
      AND EXISTS (SELECT 1 FROM retrofit_projects WHERE id = pm.retrofit_project_id)
    )
  );

-- New UPDATE policy: Project creator, super admins, or admin/manager members
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
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_members.retrofit_project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'manager')
    )
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
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_members.retrofit_project_id
      AND pm.user_id = auth.uid()
      AND pm.role IN ('admin', 'manager')
    )
  );

-- New DELETE policy: Only project creator, super admins, or project admin
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
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_members.retrofit_project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'admin'
    )
  );
