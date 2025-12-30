/*
  # Auto-update PM Status Based on Activities

  1. Changes
    - Creates a function to calculate pm_status from project activities
    - Adds trigger to auto-update pm_status when activities change
    
  2. Logic
    - Draft: No activities or all Pending
    - Active: Any activities in Work in Progress or Ready for Inspection
    - Completed: All activities are Closed
    - On Hold/Cancelled: Must be set manually (preserved if already set)
*/

-- Function to calculate and update pm_status
CREATE OR REPLACE FUNCTION public.update_project_pm_status()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id uuid;
  v_total_activities int;
  v_pending_activities int;
  v_active_activities int;
  v_closed_activities int;
  v_current_status text;
  v_new_status text;
BEGIN
  -- Determine project ID from the operation
  IF (TG_OP = 'DELETE') THEN
    v_project_id := OLD.retrofit_project_id;
  ELSE
    v_project_id := NEW.retrofit_project_id;
  END IF;

  -- Get current status (to preserve manual overrides like On Hold/Cancelled)
  SELECT pm_status INTO v_current_status
  FROM retrofit_projects
  WHERE id = v_project_id;

  -- Don't auto-update if manually set to On Hold or Cancelled
  IF v_current_status IN ('On Hold', 'Cancelled') THEN
    RETURN NEW;
  END IF;

  -- Count activities by status
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'Pending'),
    COUNT(*) FILTER (WHERE status IN ('Work in Progress', 'Ready for Inspection')),
    COUNT(*) FILTER (WHERE status = 'Closed')
  INTO v_total_activities, v_pending_activities, v_active_activities, v_closed_activities
  FROM project_activities
  WHERE retrofit_project_id = v_project_id;

  -- Determine new status
  IF v_total_activities = 0 THEN
    v_new_status := 'Draft';
  ELSIF v_closed_activities = v_total_activities THEN
    v_new_status := 'Completed';
  ELSIF v_active_activities > 0 THEN
    v_new_status := 'Active';
  ELSIF v_pending_activities = v_total_activities THEN
    v_new_status := 'Draft';
  ELSE
    v_new_status := 'Active';
  END IF;

  -- Update project status
  UPDATE retrofit_projects
  SET pm_status = v_new_status,
      updated_at = now()
  WHERE id = v_project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_update_pm_status ON project_activities;

-- Create trigger
CREATE TRIGGER trigger_update_pm_status
  AFTER INSERT OR UPDATE OF status OR DELETE ON project_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_pm_status();

-- Add pm_status to ProjectSettings for manual override (On Hold/Cancelled only)
COMMENT ON COLUMN retrofit_projects.pm_status IS 'Auto-calculated from activities (Draft/Active/Completed) or manually set (On Hold/Cancelled)';
