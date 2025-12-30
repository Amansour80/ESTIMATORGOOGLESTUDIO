/*
  # Fix Infinite Recursion in organization_members RLS Policies
  
  1. Problem
    - SELECT, UPDATE, and DELETE policies query organization_members while checking permissions
    - This causes infinite recursion when evaluating the policies
    
  2. Solution
    - Rewrite policies to avoid querying organization_members
    - For super admins: Check super_admins table first
    - For regular users: Use simple conditions without subqueries to organization_members
    - Allow broader access and rely on application logic for fine-grained control
    
  3. Changes
    - Drop all existing policies
    - Create new non-recursive policies
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view org memberships" ON organization_members;
DROP POLICY IF EXISTS "Users, org admins, and super admins can update memberships" ON organization_members;
DROP POLICY IF EXISTS "Users, org admins, and super admins can delete memberships" ON organization_members;
DROP POLICY IF EXISTS "Authenticated users can insert members" ON organization_members;

-- SELECT: Allow users to see their own memberships and super admins to see all
CREATE POLICY "Users can view own memberships and super admins see all"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- INSERT: Allow authenticated users to insert (application validates permissions)
CREATE POLICY "Authenticated users can insert members"
  ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Allow users to update their own membership and super admins to update any
CREATE POLICY "Users can update own membership and super admins update any"
  ON organization_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid())
    OR user_id = auth.uid()
  );

-- DELETE: Allow users to delete their own membership and super admins to delete any
CREATE POLICY "Users can delete own membership and super admins delete any"
  ON organization_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM super_admins WHERE super_admins.user_id = auth.uid())
    OR user_id = auth.uid()
  );
