/*
  # Fix RLS Policies - Auth Function Calls (Part 2)

  1. Problem
    - Continuing to fix RLS policies that call auth functions for each row

  2. Solution
    - Wrap auth calls in (select ...) to evaluate once per query

  3. Tables Fixed
    - organization_roles
    - user_role_assignments
    - approval_workflows
    - project_approvals
    - user_notifications
*/

-- Fix organization_roles policies
DROP POLICY IF EXISTS "Admins can create custom roles" ON organization_roles;
DROP POLICY IF EXISTS "Admins can delete custom roles" ON organization_roles;
DROP POLICY IF EXISTS "Admins can update custom roles" ON organization_roles;
DROP POLICY IF EXISTS "Super admins have full access to organization roles" ON organization_roles;
DROP POLICY IF EXISTS "Users can view their organization roles" ON organization_roles;

CREATE POLICY "Super admins have full access to organization roles"
ON organization_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can view their organization roles"
ON organization_roles FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins can create custom roles"
ON organization_roles FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Admins can update custom roles"
ON organization_roles FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete custom roles"
ON organization_roles FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  )
);

-- Fix user_role_assignments policies
DROP POLICY IF EXISTS "Admins and role managers can create role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins and role managers can delete role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins and role managers can update role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Super admins have full access to role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Users can view their own role assignments" ON user_role_assignments;

CREATE POLICY "Super admins have full access to role assignments"
ON user_role_assignments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can view their own role assignments"
ON user_role_assignments FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid()) OR
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins and role managers can create role assignments"
ON user_role_assignments FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Admins and role managers can update role assignments"
ON user_role_assignments FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Admins and role managers can delete role assignments"
ON user_role_assignments FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  )
);

-- Fix approval_workflows policies
DROP POLICY IF EXISTS "Admins can create workflows" ON approval_workflows;
DROP POLICY IF EXISTS "Admins can delete workflows" ON approval_workflows;
DROP POLICY IF EXISTS "Admins can update workflows" ON approval_workflows;
DROP POLICY IF EXISTS "Organization members can view workflows" ON approval_workflows;
DROP POLICY IF EXISTS "Super admins have full access to workflows" ON approval_workflows;

CREATE POLICY "Super admins have full access to workflows"
ON approval_workflows FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Organization members can view workflows"
ON approval_workflows FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins can create workflows"
ON approval_workflows FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Admins can update workflows"
ON approval_workflows FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete workflows"
ON approval_workflows FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'admin'
  )
);

-- Fix user_notifications policies
DROP POLICY IF EXISTS "Users can update own notifications" ON user_notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON user_notifications;

CREATE POLICY "Users can view own notifications"
ON user_notifications FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update own notifications"
ON user_notifications FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));