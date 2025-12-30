/*
  # Fix Document and Issue Permissions for Project Members
  
  1. Changes
    - Update project_documents RLS policies to allow all project members
    - Update project_issues RLS policies to allow all project members
    
  2. Rationale
    - Simplify permission model so all project members can manage documents and issues
*/

-- Drop and recreate document policies
DROP POLICY IF EXISTS "Members with create permission can add documents" ON project_documents;
DROP POLICY IF EXISTS "Members with edit permission can update documents" ON project_documents;
DROP POLICY IF EXISTS "Members with delete permission can remove documents" ON project_documents;

CREATE POLICY "Project members can add documents"
  ON project_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_documents.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can update documents"
  ON project_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_documents.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_documents.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can delete documents"
  ON project_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_documents.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Drop and recreate issue policies
DROP POLICY IF EXISTS "Members with create permission can add issues" ON project_issues;
DROP POLICY IF EXISTS "Members with edit permission can update issues" ON project_issues;
DROP POLICY IF EXISTS "Members with delete permission can remove issues" ON project_issues;

CREATE POLICY "Project members can add issues"
  ON project_issues FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_issues.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can update issues"
  ON project_issues FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_issues.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_issues.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project members can delete issues"
  ON project_issues FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = project_issues.retrofit_project_id
      AND pm.user_id = auth.uid()
    )
  );
