/*
  # Consolidate Duplicate RLS Policies (Part 1)

  1. Problem
    - Multiple permissive policies exist for the same action
    - This is inefficient and can cause confusion
    - Super admin + regular user policies are redundant

  2. Solution
    - Combine super admin and regular user policies into single policies
    - Use OR conditions to handle both cases

  3. Tables Fixed
    - approval_notifications
    - project_approval_history
    - user_profiles
    - subscriptions
*/

-- Fix approval_notifications SELECT policies
DROP POLICY IF EXISTS "Super admins can view all notifications" ON approval_notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON approval_notifications;

CREATE POLICY "Users can view notifications"
ON approval_notifications FOR SELECT
TO authenticated
USING (
  user_id = (select auth.uid()) OR
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);

-- Fix project_approval_history SELECT policies
DROP POLICY IF EXISTS "Super admins can view all approval history" ON project_approval_history;
DROP POLICY IF EXISTS "Users can view organization approval history" ON project_approval_history;

CREATE POLICY "Users can view approval history"
ON project_approval_history FOR SELECT
TO authenticated
USING (
  project_approval_id IN (
    SELECT pa.id FROM project_approvals pa
    INNER JOIN organization_members om ON om.organization_id = pa.organization_id
    WHERE om.user_id = (select auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);

-- Fix user_profiles SELECT policies
DROP POLICY IF EXISTS "Super admin can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;

CREATE POLICY "Users can read profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (
  id = (select auth.uid()) OR
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);

-- Fix user_profiles UPDATE policies
DROP POLICY IF EXISTS "Super admin can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can update profiles"
ON user_profiles FOR UPDATE
TO authenticated
USING (
  id = (select auth.uid()) OR
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
)
WITH CHECK (
  id = (select auth.uid()) OR
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);

-- Fix subscriptions UPDATE policies
DROP POLICY IF EXISTS "Only owners can update subscription" ON subscriptions;
DROP POLICY IF EXISTS "Super admins can update any subscription" ON subscriptions;

CREATE POLICY "Authorized users can update subscriptions"
ON subscriptions FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'owner'
  ) OR
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members 
    WHERE user_id = (select auth.uid()) AND role = 'owner'
  ) OR
  EXISTS (
    SELECT 1 FROM super_admins 
    WHERE user_id = (select auth.uid())
  )
);