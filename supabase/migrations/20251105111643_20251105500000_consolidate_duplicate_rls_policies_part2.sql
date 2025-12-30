/*
  # Consolidate Duplicate RLS Policies (Part 2)

  1. Problem
    - Multiple permissive policies for workflow tables
    - Super admin policies can be merged with regular policies

  2. Solution
    - Consolidate policies using OR conditions

  3. Tables Fixed
    - approval_workflow_canvas (4 operations)
    - approval_workflow_rules (4 operations)
    - approval_workflows (4 operations)
*/

-- Fix approval_workflow_canvas policies
DROP POLICY IF EXISTS "Super admins have full access to workflow canvas" ON approval_workflow_canvas;
DROP POLICY IF EXISTS "Organization members can view workflow canvas" ON approval_workflow_canvas;
DROP POLICY IF EXISTS "Admins can create workflow canvas" ON approval_workflow_canvas;
DROP POLICY IF EXISTS "Admins can update workflow canvas" ON approval_workflow_canvas;
DROP POLICY IF EXISTS "Admins can delete workflow canvas" ON approval_workflow_canvas;

CREATE POLICY "Users can view workflow canvas"
ON approval_workflow_canvas FOR SELECT
TO authenticated
USING (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

CREATE POLICY "Admins can manage workflow canvas"
ON approval_workflow_canvas FOR ALL
TO authenticated
USING (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid()) AND om.role = 'admin'
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
)
WITH CHECK (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid()) AND om.role = 'admin'
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

-- Fix approval_workflow_rules policies
DROP POLICY IF EXISTS "Super admins have full access to workflow rules" ON approval_workflow_rules;
DROP POLICY IF EXISTS "Organization members can view workflow rules" ON approval_workflow_rules;
DROP POLICY IF EXISTS "Admins can create workflow rules" ON approval_workflow_rules;
DROP POLICY IF EXISTS "Admins can update workflow rules" ON approval_workflow_rules;
DROP POLICY IF EXISTS "Admins can delete workflow rules" ON approval_workflow_rules;

CREATE POLICY "Users can view workflow rules"
ON approval_workflow_rules FOR SELECT
TO authenticated
USING (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

CREATE POLICY "Admins can manage workflow rules"
ON approval_workflow_rules FOR ALL
TO authenticated
USING (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid()) AND om.role = 'admin'
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
)
WITH CHECK (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid()) AND om.role = 'admin'
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

-- Fix approval_workflows policies
DROP POLICY IF EXISTS "Super admins have full access to workflows" ON approval_workflows;
DROP POLICY IF EXISTS "Organization members can view workflows" ON approval_workflows;
DROP POLICY IF EXISTS "Admins can create workflows" ON approval_workflows;
DROP POLICY IF EXISTS "Admins can update workflows" ON approval_workflows;
DROP POLICY IF EXISTS "Admins can delete workflows" ON approval_workflows;

CREATE POLICY "Users can view workflows"
ON approval_workflows FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid())
  ) OR
  EXISTS (SELECT 1 FROM super_admins WHERE user_id = (select auth.uid()))
);

CREATE POLICY "Admins can manage workflows"
ON approval_workflows FOR ALL
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