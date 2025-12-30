/*
  # Auto-add project creator as member on creation

  1. Problem
    - Project creators are only added as members when project is approved
    - This prevents them from adding activities before approval

  2. Solution
    - Add creator as "manager" immediately when project is created
    - This allows them to work on the project before approval
*/

-- Create function to auto-add creator as project member on creation
CREATE OR REPLACE FUNCTION add_creator_on_project_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Add the creator as a project member with "manager" role
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

  RETURN NEW;
END;
$$;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS trigger_add_creator_on_project_creation ON retrofit_projects;
CREATE TRIGGER trigger_add_creator_on_project_creation
  AFTER INSERT ON retrofit_projects
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_on_project_creation();

-- Backfill: Add creators as members for all existing projects that don't have the creator as a member
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
WHERE NOT EXISTS (
  SELECT 1 FROM project_members pm
  WHERE pm.retrofit_project_id = rp.id
  AND pm.user_id = rp.user_id
)
ON CONFLICT (retrofit_project_id, user_id) DO NOTHING;