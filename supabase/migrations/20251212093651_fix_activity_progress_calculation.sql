/*
  # Fix Activity Progress Calculation

  1. Changes
    - Fix the calculate_activity_progress_from_time function to properly handle date subtraction
    - Convert dates to timestamps before calculating the difference
    - Ensure the function works correctly when triggered by time log inserts/updates

  2. Notes
    - The original function had a type error with EXTRACT on integer values
    - Now properly converts dates to timestamps for interval calculation
*/

CREATE OR REPLACE FUNCTION calculate_activity_progress_from_time()
RETURNS TRIGGER AS $$
DECLARE
  total_logged_hours numeric;
  estimated_hours numeric;
  new_progress integer;
  activity_start_date date;
  activity_end_date date;
BEGIN
  -- Get total hours logged for this activity
  SELECT COALESCE(SUM(hours_worked), 0)
  INTO total_logged_hours
  FROM activity_time_logs
  WHERE activity_id = COALESCE(NEW.activity_id, OLD.activity_id);

  -- Get activity dates
  SELECT start_date, end_date
  INTO activity_start_date, activity_end_date
  FROM project_activities
  WHERE id = COALESCE(NEW.activity_id, OLD.activity_id);

  -- Calculate estimated hours (8 hours per day)
  -- Convert dates to timestamps for proper interval calculation
  estimated_hours := COALESCE(
    EXTRACT(EPOCH FROM (activity_end_date::timestamp - activity_start_date::timestamp)) / 3600 * 8 / 24,
    40
  );

  -- Ensure we don't divide by zero
  IF estimated_hours = 0 THEN
    estimated_hours := 40;
  END IF;

  -- Calculate progress (0-100%)
  new_progress := LEAST(100, GREATEST(0, ROUND((total_logged_hours / estimated_hours * 100)::numeric)));

  -- Update activity progress
  UPDATE project_activities
  SET progress_percent = new_progress,
      updated_at = now()
  WHERE id = COALESCE(NEW.activity_id, OLD.activity_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it works for all operations
DROP TRIGGER IF EXISTS update_activity_progress_on_time_log ON activity_time_logs;
CREATE TRIGGER update_activity_progress_on_time_log
  AFTER INSERT OR UPDATE OR DELETE ON activity_time_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_activity_progress_from_time();
