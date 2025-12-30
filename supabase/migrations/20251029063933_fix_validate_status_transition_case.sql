/*
  # Fix validate_project_status_transition Function - Case Sensitivity Issue

  1. Problem
    - The validate_project_status_transition() function uses lowercase status values ('submitted', 'awarded', etc.)
    - But the project_status enum uses uppercase values ('SUBMITTED', 'AWARDED', etc.)
    - This causes the error: invalid input value for enum public.project_status: "submitted"

  2. Solution
    - Update the function to use UPPERCASE status values
    - Change 'submitted' → 'SUBMITTED'
    - Change 'awarded' → 'AWARDED'
    - Change 'lost' → 'LOST'
    - Change 'cancelled' → 'CANCELLED'

  3. Impact
    - This will fix status transitions for all project types (FM, Retrofit, HK)
*/

-- Fix validate_project_status_transition with correct UPPERCASE enum values
CREATE OR REPLACE FUNCTION validate_project_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If status hasn't changed, skip validation
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Set timestamp fields based on new status (using UPPERCASE)
  IF NEW.status = 'SUBMITTED' THEN
    NEW.submitted_at = NOW();
  ELSIF NEW.status = 'AWARDED' THEN
    NEW.awarded_at = NOW();
  ELSIF NEW.status = 'LOST' THEN
    NEW.lost_at = NOW();
  ELSIF NEW.status = 'CANCELLED' THEN
    NEW.cancelled_at = NOW();
  END IF;
  
  -- Log status change in history
  NEW.status_history = COALESCE(NEW.status_history, '[]'::jsonb) || 
    jsonb_build_object(
      'status', NEW.status,
      'timestamp', NOW(),
      'previous_status', OLD.status
    );
  
  RETURN NEW;
END;
$$;

ALTER FUNCTION validate_project_status_transition() SET search_path = '';
