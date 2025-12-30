/*
  # Fix Activity Permissions for Project Members
  
  1. Changes
    - Update project_activities RLS policies to allow all project members to edit
    - Simplify permission checks to just verify membership
    
  2. Rationale
    - The strict permission checks were preventing project members from updating activities
    - Project members should be able to manage activities by default
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Members with create permission can add activities" ON project_activities;
DROP POLICY IF EXISTS "Members with edit permission can update activities" ON project_activities;
DROP POLICY IF EXISTS "Members with delete permission can remove activities" ON project_activities;

-- Create more permissive policies for project members
CREATE POLICY "Project members can add activities"
  ON project_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_activities.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can update activities"
  ON project_activities FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_activities.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_activities.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can delete activities"
  ON project_activities FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_activities.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );
