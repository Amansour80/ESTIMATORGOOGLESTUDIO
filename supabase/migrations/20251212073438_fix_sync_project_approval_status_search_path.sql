/*
  # Fix sync_project_approval_status search_path
  
  1. Problem
    - Trigger function has empty search_path causing "relation does not exist" errors
  
  2. Solution
    - Set search_path to 'public' so it can find the project tables
*/

CREATE OR REPLACE FUNCTION sync_project_approval_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update the corresponding project table based on project type
  IF NEW.project_type = 'fm' THEN
    UPDATE public.fm_projects
    SET 
      approval_status = NEW.status,
      is_locked = CASE 
        WHEN NEW.status = 'pending' THEN true
        WHEN NEW.status IN ('approved', 'rejected', 'draft') THEN false
        ELSE is_locked
      END,
      approved_at = CASE WHEN NEW.status = 'approved' THEN NEW.completed_at ELSE approved_at END,
      approved_by = CASE WHEN NEW.status = 'approved' THEN NEW.submitted_by ELSE approved_by END
    WHERE id = NEW.project_id;

  ELSIF NEW.project_type = 'retrofit' THEN
    UPDATE public.retrofit_projects
    SET 
      approval_status = NEW.status,
      is_locked = CASE 
        WHEN NEW.status = 'pending' THEN true
        WHEN NEW.status IN ('approved', 'rejected', 'draft') THEN false
        ELSE is_locked
      END,
      approved_at = CASE WHEN NEW.status = 'approved' THEN NEW.completed_at ELSE approved_at END,
      approved_by = CASE WHEN NEW.status = 'approved' THEN NEW.submitted_by ELSE approved_by END
    WHERE id = NEW.project_id;

  ELSIF NEW.project_type = 'hk' THEN
    UPDATE public.hk_projects
    SET 
      approval_status = NEW.status,
      is_locked = CASE 
        WHEN NEW.status = 'pending' THEN true
        WHEN NEW.status IN ('approved', 'rejected', 'draft') THEN false
        ELSE is_locked
      END,
      approved_at = CASE WHEN NEW.status = 'approved' THEN NEW.completed_at ELSE approved_at END,
      approved_by = CASE WHEN NEW.status = 'approved' THEN NEW.submitted_by ELSE approved_by END
    WHERE id = NEW.project_id;
  END IF;

  RETURN NEW;
END;
$$;