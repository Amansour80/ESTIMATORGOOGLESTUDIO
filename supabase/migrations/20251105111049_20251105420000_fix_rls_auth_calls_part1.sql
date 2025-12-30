/*
  # Fix RLS Policies - Auth Function Calls (Part 1)

  1. Problem
    - RLS policies call auth.uid() and auth.jwt() for each row
    - This causes performance issues at scale
    - Functions are re-evaluated for every row in the result set

  2. Solution
    - Wrap auth calls in (select ...) to evaluate once per query
    - Pattern: auth.uid() becomes (select auth.uid())
    - This evaluates the function once and uses the result for all rows

  3. Tables Fixed
    - project_approval_history
    - approval_notifications
    - approval_workflow_rules
    - approval_workflow_canvas
*/

-- Fix project_approval_history policies
DROP POLICY IF EXISTS "Super admins can view all approval history" ON project_approval_history;
DROP POLICY IF EXISTS "System can insert approval history" ON project_approval_history;
DROP POLICY IF EXISTS "Users can view organization approval history" ON project_approval_history;

CREATE POLICY "Super admins can view all approval history"
ON project_approval_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "System can insert approval history"
ON project_approval_history FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can view organization approval history"
ON project_approval_history FOR SELECT
TO authenticated
USING (
  project_approval_id IN (
    SELECT pa.id FROM project_approvals pa
    INNER JOIN organization_members om ON om.organization_id = pa.organization_id
    WHERE om.user_id = (select auth.uid())
  )
);

-- Fix approval_notifications policies
DROP POLICY IF EXISTS "Super admins can view all notifications" ON approval_notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON approval_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON approval_notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON approval_notifications;

CREATE POLICY "Super admins can view all notifications"
ON approval_notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Users can view their own notifications"
ON approval_notifications FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));

CREATE POLICY "Users can update their own notifications"
ON approval_notifications FOR UPDATE
TO authenticated
USING (user_id = (select auth.uid()))
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their own notifications"
ON approval_notifications FOR DELETE
TO authenticated
USING (user_id = (select auth.uid()));

-- Fix approval_workflow_rules policies
DROP POLICY IF EXISTS "Admins can create workflow rules" ON approval_workflow_rules;
DROP POLICY IF EXISTS "Admins can delete workflow rules" ON approval_workflow_rules;
DROP POLICY IF EXISTS "Admins can update workflow rules" ON approval_workflow_rules;
DROP POLICY IF EXISTS "Organization members can view workflow rules" ON approval_workflow_rules;
DROP POLICY IF EXISTS "Super admins have full access to workflow rules" ON approval_workflow_rules;

CREATE POLICY "Super admins have full access to workflow rules"
ON approval_workflow_rules FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Organization members can view workflow rules"
ON approval_workflow_rules FOR SELECT
TO authenticated
USING (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins can create workflow rules"
ON approval_workflow_rules FOR INSERT
TO authenticated
WITH CHECK (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid()) AND om.role = 'admin'
  )
);

CREATE POLICY "Admins can update workflow rules"
ON approval_workflow_rules FOR UPDATE
TO authenticated
USING (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid()) AND om.role = 'admin'
  )
);

CREATE POLICY "Admins can delete workflow rules"
ON approval_workflow_rules FOR DELETE
TO authenticated
USING (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid()) AND om.role = 'admin'
  )
);

-- Fix approval_workflow_canvas policies
DROP POLICY IF EXISTS "Admins can create workflow canvas" ON approval_workflow_canvas;
DROP POLICY IF EXISTS "Admins can delete workflow canvas" ON approval_workflow_canvas;
DROP POLICY IF EXISTS "Admins can update workflow canvas" ON approval_workflow_canvas;
DROP POLICY IF EXISTS "Organization members can view workflow canvas" ON approval_workflow_canvas;
DROP POLICY IF EXISTS "Super admins have full access to workflow canvas" ON approval_workflow_canvas;

CREATE POLICY "Super admins have full access to workflow canvas"
ON approval_workflow_canvas FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);

CREATE POLICY "Organization members can view workflow canvas"
ON approval_workflow_canvas FOR SELECT
TO authenticated
USING (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid())
  )
);

CREATE POLICY "Admins can create workflow canvas"
ON approval_workflow_canvas FOR INSERT
TO authenticated
WITH CHECK (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid()) AND om.role = 'admin'
  )
);

CREATE POLICY "Admins can update workflow canvas"
ON approval_workflow_canvas FOR UPDATE
TO authenticated
USING (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid()) AND om.role = 'admin'
  )
);

CREATE POLICY "Admins can delete workflow canvas"
ON approval_workflow_canvas FOR DELETE
TO authenticated
USING (
  workflow_id IN (
    SELECT w.id FROM approval_workflows w
    INNER JOIN organization_members om ON om.organization_id = w.organization_id
    WHERE om.user_id = (select auth.uid()) AND om.role = 'admin'
  )
);