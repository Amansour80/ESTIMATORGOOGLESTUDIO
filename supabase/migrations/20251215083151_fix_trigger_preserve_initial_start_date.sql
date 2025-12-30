/*
  # Fix Activity Date Trigger to Preserve Initial Start Date

  The trigger was recalculating start_date on INSERT even when the user
  provided a calculated start_date. This caused issues because dependencies
  are inserted AFTER the activity is created, so the trigger couldn't see them.

  Fix: On INSERT, if a start_date is provided, trust it and don't recalculate.
  Only recalculate on UPDATE or if start_date is NULL.
*/

CREATE OR REPLACE FUNCTION calculate_activity_dates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_calculated_start date;
  v_warning text;
BEGIN
  -- On INSERT: Only calculate if start_date is NULL
  -- On UPDATE: Calculate if not an override
  IF TG_OP = 'INSERT' THEN
    -- If start_date is provided, trust it (dependencies haven't been inserted yet)
    IF NEW.start_date IS NOT NULL THEN
      -- Just calculate end date
      IF NEW.duration_days IS NOT NULL THEN
        NEW.end_date := NEW.start_date + NEW.duration_days;
      END IF;
      RETURN NEW;
    END IF;
    
    -- No start_date provided, calculate it
    v_calculated_start := calculate_activity_start_date(NEW.retrofit_project_id, NEW.id);
    NEW.start_date := v_calculated_start;
    NEW.is_date_override := false;
    NEW.override_warning := NULL;
  ELSE
    -- UPDATE: Recalculate if not an override
    IF NEW.is_date_override = false THEN
      v_calculated_start := calculate_activity_start_date(NEW.retrofit_project_id, NEW.id);
      NEW.start_date := v_calculated_start;
      NEW.override_warning := NULL;
    ELSE
      -- User manually set start date, check for conflicts
      v_warning := check_dependency_conflicts(NEW.id, NEW.start_date);
      NEW.override_warning := v_warning;
    END IF;
  END IF;

  -- Always calculate end date from start + duration
  IF NEW.start_date IS NOT NULL AND NEW.duration_days IS NOT NULL THEN
    NEW.end_date := NEW.start_date + NEW.duration_days;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger (no changes needed, just for clarity)
DROP TRIGGER IF EXISTS trigger_calculate_activity_dates ON project_activities;
CREATE TRIGGER trigger_calculate_activity_dates
  BEFORE INSERT OR UPDATE OF duration_days, start_date, is_date_override
  ON project_activities
  FOR EACH ROW
  EXECUTE FUNCTION calculate_activity_dates();
