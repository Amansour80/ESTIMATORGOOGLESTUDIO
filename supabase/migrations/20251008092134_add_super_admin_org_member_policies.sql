/*
  # Add Super Admin Policies for Organization Members
  
  1. Changes
    - Allow super admins to delete any organization membership
    - Super admins are identified by the super_admins table
    
  2. Security
    - Super admins can delete any user from any organization
    - This is needed for the admin dashboard to reassign users to different organizations
*/

-- Drop existing delete policy
DROP POLICY IF EXISTS "Users can delete their own membership" ON organization_members;

-- Recreate delete policy that allows users to delete their own membership OR super admins to delete any
CREATE POLICY "Users and super admins can delete memberships"
  ON organization_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE super_admins.user_id = auth.uid()
    )
  );
