/*
  # Fix FM Projects UPDATE and DELETE RLS Policies

  1. Issue
    - UPDATE and DELETE policies also use the problematic nested EXISTS subquery

  2. Solution
    - Drop and recreate with the same improved structure as SELECT policy

  3. Security
    - Maintains authentication requirement
    - Allows users to update/delete organization projects
*/

-- Fix UPDATE policy
DROP POLICY IF EXISTS "Users can update organization projects" ON fm_projects;

CREATE POLICY "Users can update organization projects"
  ON fm_projects FOR UPDATE
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

-- Fix DELETE policy
DROP POLICY IF EXISTS "Users can delete organization projects" ON fm_projects;

CREATE POLICY "Users can delete organization projects"
  ON fm_projects FOR DELETE
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