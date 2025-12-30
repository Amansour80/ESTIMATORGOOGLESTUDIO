/*
  # Auto-add project creator as member (v2)
  
  1. Problem
    - When retrofit projects are created, the creator is not automatically added to project_members
    - This causes projects to not show up in Retrofit PM
  
  2. Solution
    - Create a trigger to automatically add the creator as "manager" when project is approved
    - Backfill existing approved projects
*/

-- Create function to auto-add creator as project member when approved
CREATE OR REPLACE FUNCTION add_creator_as_project_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- When a project is approved, add the creator as a project member if not already added
  IF NEW.approval_status = 'approved' AND (OLD.approval_status IS NULL OR OLD.approval_status != 'approved') THEN
    INSERT INTO project_members (
      organization_id,
      retrofit_project_id,
      user_id,
      role,
      created_at,
      updated_at
    )
    VALUES (
      NEW.organization_id,
      NEW.id,
      NEW.user_id,
      'manager',
      now(),
      now()
    )
    ON CONFLICT (retrofit_project_id, user_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_add_creator_as_project_member ON retrofit_projects;
CREATE TRIGGER trigger_add_creator_as_project_member
  AFTER UPDATE ON retrofit_projects
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_project_member();

-- Backfill: Add creators as members for all approved projects that don't have members yet
INSERT INTO project_members (
  organization_id,
  retrofit_project_id,
  user_id,
  role,
  created_at,
  updated_at
)
SELECT 
  rp.organization_id,
  rp.id,
  rp.user_id,
  'manager',
  now(),
  now()
FROM retrofit_projects rp
WHERE rp.approval_status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.retrofit_project_id = rp.id 
    AND pm.user_id = rp.user_id
  )
ON CONFLICT (retrofit_project_id, user_id) DO NOTHING;