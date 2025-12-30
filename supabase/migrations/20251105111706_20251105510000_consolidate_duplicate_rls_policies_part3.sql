/*
  # Consolidate Duplicate RLS Policies (Part 3)

  1. Problem
    - Multiple permissive policies for remaining tables

  2. Solution
    - Consolidate policies using OR conditions

  3. Tables Fixed
    - organization_roles (4 operations)
    - user_role_assignments (4 operations)
    - inquiries (4 operations)
    - project_approvals (3 operations)
*/

-- Fix organization_roles policies
DROP POLICY IF EXISTS "Super admins have full access to organization roles" ON organization_roles;
DROP POLICY IF EXISTS "Users can view their organization roles" ON organization_roles;
DROP POLICY IF EXISTS "Admins can create custom roles" ON organization_roles;
DROP POLICY IF EXISTS "Admins can update custom roles" ON organization_roles;
DROP POLICY IF EXISTS "Admins can delete custom roles" ON organization_roles;

CREATE POLICY "Users can view organization roles"
ON organization_roles FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

CREATE POLICY "Admins can manage organization roles"
ON organization_roles FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

-- Fix user_role_assignments policies
DROP POLICY IF EXISTS "Super admins have full access to role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Users can view their own role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins and role managers can create role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins and role managers can update role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins and role managers can delete role assignments" ON user_role_assignments;

CREATE POLICY "Users can view role assignments"
ON user_role_assignments FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid()) OR
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

CREATE POLICY "Admins can manage role assignments"
ON user_role_assignments FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

-- Fix inquiries policies
DROP POLICY IF EXISTS "Super admins have full access to inquiries" ON inquiries;
DROP POLICY IF EXISTS "Organization members can view inquiries" ON inquiries;
DROP POLICY IF EXISTS "Organization members can create inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins and estimators can update inquiries" ON inquiries;
DROP POLICY IF EXISTS "Admins can delete inquiries" ON inquiries;

CREATE POLICY "Users can view inquiries"
ON inquiries FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

CREATE POLICY "Members can create inquiries"
ON inquiries FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

CREATE POLICY "Authorized users can update inquiries"
ON inquiries FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role IN ('admin', 'estimator')
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

CREATE POLICY "Admins can delete inquiries"
ON inquiries FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

-- Fix project_approvals policies
DROP POLICY IF EXISTS "Super admins have full access to project approvals" ON project_approvals;
DROP POLICY IF EXISTS "Users can view organization project approvals" ON project_approvals;
DROP POLICY IF EXISTS "Users can create project approvals" ON project_approvals;
DROP POLICY IF EXISTS "System can update approvals" ON project_approvals;

CREATE POLICY "Users can view project approvals"
ON project_approvals FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

CREATE POLICY "Users can manage project approvals"
ON project_approvals FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);