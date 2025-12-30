/*
  # Fix Super Admin Policies for Organization Members - All Operations
  
  1. Changes
    - Allow super admins to SELECT any organization membership
    - Keep existing DELETE policy for super admins
    - These are needed for super admin dashboard to view and manage all users
    
  2. Security
    - Super admins can view all memberships (needed to see who's in which org)
    - Super admins can delete any membership (already added in previous migration)
    - Regular users can only see their own memberships
*/

-- Drop and recreate SELECT policy to include super admins
DROP POLICY IF EXISTS "Users can view their own memberships" ON organization_members;

CREATE POLICY "Users and super admins can view memberships"
  ON organization_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.user_id = auth.uid()
    )
  );

-- Also update the "Users can view members of their organizations" policy if it exists
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
