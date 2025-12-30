/*
  # Fix RLS Policies - Auth Function Calls (Part 3)

  1. Problem
    - Continuing to fix RLS policies that call auth functions for each row

  2. Solution
    - Wrap auth calls in (select ...) to evaluate once per query

  3. Tables Fixed
    - project_approvals
*/

-- Fix project_approvals policies
DROP POLICY IF EXISTS "Authorized users can update project approvals" ON project_approvals;
DROP POLICY IF EXISTS "Super admins have full access to project approvals" ON project_approvals;
DROP POLICY IF EXISTS "System can update approvals" ON project_approvals;
DROP POLICY IF EXISTS "Users can create approvals in their organization" ON project_approvals;
DROP POLICY IF EXISTS "Users can create project approvals" ON project_approvals;
DROP POLICY IF EXISTS "Users can view approvals in their organization" ON project_approvals;
DROP POLICY IF EXISTS "Users can view organization project approvals" ON project_approvals;

CREATE POLICY "Super admins have full access to project approvals"
ON project_approvals FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can view organization project approvals"
ON project_approvals FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can create project approvals"
ON project_approvals FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "System can update approvals"
ON project_approvals FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  )
);