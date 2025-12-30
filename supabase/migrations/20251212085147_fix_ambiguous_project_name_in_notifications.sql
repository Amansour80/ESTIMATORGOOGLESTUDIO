/*
  # Fix Ambiguous project_name Column Reference
  
  1. Changes
    - Fix `notify_activity_assignment()` function to properly qualify column names
    - Prevents "column reference 'project_name' is ambiguous" error
  
  2. Details
    - The SELECT statement was referencing project_name without table qualification
    - This caused ambiguity in the SQL parser
*/

-- Fix the notify_activity_assignment function
CREATE OR REPLACE FUNCTION notify_activity_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_name text;
  project_name text;
BEGIN
  -- Only notify if assignee changed and is not null
  IF (TG_OP = 'INSERT' AND NEW.assignee_user_id IS NOT NULL) OR
     (TG_OP = 'UPDATE' AND NEW.assignee_user_id IS NOT NULL AND 
      (OLD.assignee_user_id IS NULL OR OLD.assignee_user_id != NEW.assignee_user_id)) THEN
    
    -- Get activity and project names (with table qualification)
    SELECT NEW.name INTO activity_name;
    SELECT rp.project_name INTO project_name
    FROM retrofit_projects rp
    WHERE rp.id = NEW.retrofit_project_id;
    
    -- Create notification
    PERFORM create_pm_notification(
      NEW.assignee_user_id,
      NEW.organization_id,
      'activity_assigned',
      'activity',
      NEW.id,
      'You have been assigned to activity: ' || activity_name || ' in project ' || project_name
    );
  END IF;
  
  RETURN NEW;
END;
$$;
