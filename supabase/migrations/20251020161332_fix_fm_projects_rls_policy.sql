/*
  # Fix FM Projects RLS Policy for Organization Access

  1. Issue
    - Current policy uses nested EXISTS subquery that isn't working correctly
    - Users can only see their own projects, not organization members' projects

  2. Solution
    - Drop and recreate the SELECT policy with a simpler, more explicit join
    - Use a lateral join for better query optimization

  3. Security
    - Maintains authentication requirement
    - Allows users to see:
      a) Their own projects (user_id = auth.uid())
      b) Projects from users in the same organization
*/

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view organization projects" ON fm_projects;

-- Create new policy with better query structure
CREATE POLICY "Users can view organization projects"
  ON fm_projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    user_id IN (
      SELECT om2.user_id
      FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om1.organization_id IS NOT NULL
        AND om2.organization_id IS NOT NULL
    )
  );