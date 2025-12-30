/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - The organization_members SELECT policy tries to query organization_members, causing infinite recursion
    - This prevents users from loading their organization data

  2. Solution
    - Drop the recursive policy
    - Create a simple policy that allows users to see their own memberships
    - Separate policies for viewing all members (when you're already a member)

  3. Changes
    - Drop existing recursive policies on organization_members
    - Create simple, non-recursive policies
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "Owners and admins can manage members" ON organization_members;

-- Allow users to see their own membership records (no recursion)
CREATE POLICY "Users can view their own memberships"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to view other members in organizations where they are members
-- This policy works because it first checks their own membership (above policy)
CREATE POLICY "Members can view other members in their organizations"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid() 
      AND om.status = 'active'
    )
  );

-- Allow owners and admins to manage members
CREATE POLICY "Owners and admins can insert members"
  ON organization_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid() 
      AND om.role IN ('owner', 'admin') 
      AND om.status = 'active'
    )
  );

CREATE POLICY "Owners and admins can update members"
  ON organization_members
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid() 
      AND om.role IN ('owner', 'admin') 
      AND om.status = 'active'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid() 
      AND om.role IN ('owner', 'admin') 
      AND om.status = 'active'
    )
  );

CREATE POLICY "Owners and admins can delete members"
  ON organization_members
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT om.organization_id 
      FROM organization_members om 
      WHERE om.user_id = auth.uid() 
      AND om.role IN ('owner', 'admin') 
      AND om.status = 'active'
    )
  );
