/*
  # Add Duration-Based Activity Scheduling

  1. Changes to retrofit_projects
    - Add `planned_start_date` (date) - Overall project start date for scheduling

  2. Changes to project_activities
    - Add `duration_days` (integer, NOT NULL) - Mandatory duration field
    - Keep `start_date` (date, nullable) - Auto-calculated but can be overridden
    - Keep `end_date` (date, nullable) - Always calculated as start_date + duration_days
    - Add `is_date_override` (boolean) - Flag when user manually overrides dates
    - Add `override_warning` (text) - Store warning message if override violates dependencies

  3. Functions
    - `calculate_activity_start_date()` - Calculates start date based on project start + dependencies
    - `calculate_activity_dates()` - Trigger function to auto-populate dates
    - `check_dependency_conflicts()` - Validates date overrides against dependencies

  4. Notes
    - Duration is the only mandatory date field
    - Start dates auto-calculated based on dependencies and project start
    - End dates always computed from start + duration
    - Manual overrides are allowed but generate warnings
*/

-- Add planned_start_date to retrofit_projects
ALTER TABLE retrofit_projects 
ADD COLUMN IF NOT EXISTS planned_start_date date DEFAULT CURRENT_DATE;

-- Add duration and scheduling fields to project_activities
ALTER TABLE project_activities
ADD COLUMN IF NOT EXISTS duration_days integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_date_override boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS override_warning text;

-- Make start_date and end_date nullable (they're calculated)
ALTER TABLE project_activities 
ALTER COLUMN start_date DROP NOT NULL,
ALTER COLUMN end_date DROP NOT NULL;

-- Function to calculate activity start date based on dependencies
CREATE OR REPLACE FUNCTION calculate_activity_start_date(
  p_project_id uuid,
  p_activity_id uuid DEFAULT NULL
)
RETURNS date
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_start date;
  v_latest_date date;
  v_dep_end_date date;
  v_dep_start_date date;
  v_lag_days integer;
  v_dep_type text;
BEGIN
  -- Get project start date
  SELECT planned_start_date INTO v_project_start
  FROM retrofit_projects
  WHERE id = p_project_id;

  IF v_project_start IS NULL THEN
    v_project_start := CURRENT_DATE;
  END IF;

  -- If no activity_id provided, return project start
  IF p_activity_id IS NULL THEN
    RETURN v_project_start;
  END IF;

  -- Initialize with project start date
  v_latest_date := v_project_start;

  -- Check all dependencies for this activity
  FOR v_dep_end_date, v_dep_start_date, v_lag_days, v_dep_type IN
    SELECT 
      pred.end_date,
      pred.start_date,
      COALESCE(dep.lag_days, 0),
      dep.dependency_type
    FROM activity_dependencies dep
    JOIN project_activities pred ON pred.id = dep.predecessor_id
    WHERE dep.successor_id = p_activity_id
      AND pred.start_date IS NOT NULL
  LOOP
    -- Calculate constraint date based on dependency type
    CASE v_dep_type
      WHEN 'finish_to_start' THEN
        -- Successor starts after predecessor finishes + lag
        IF v_dep_end_date + v_lag_days > v_latest_date THEN
          v_latest_date := v_dep_end_date + v_lag_days;
        END IF;
        
      WHEN 'start_to_start' THEN
        -- Successor starts after predecessor starts + lag
        IF v_dep_start_date + v_lag_days > v_latest_date THEN
          v_latest_date := v_dep_start_date + v_lag_days;
        END IF;
        
      WHEN 'finish_to_finish' THEN
        -- Successor must finish when predecessor finishes (adjusted by duration)
        -- This is more complex, skip for now in auto-calc
        NULL;
        
      WHEN 'start_to_finish' THEN
        -- Successor must finish when predecessor starts (rare case)
        -- Skip for now in auto-calc
        NULL;
    END CASE;
  END LOOP;

  RETURN v_latest_date;
END;
$$;

-- Function to check if manual date override creates conflicts
CREATE OR REPLACE FUNCTION check_dependency_conflicts(
  p_activity_id uuid,
  p_proposed_start_date date
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_warning text := '';
  v_calculated_start date;
  v_dep_name text;
  v_dep_end_date date;
  v_lag_days integer;
  v_activity_project_id uuid;
BEGIN
  -- Get retrofit_project_id for this activity
  SELECT retrofit_project_id INTO v_activity_project_id
  FROM project_activities
  WHERE id = p_activity_id;

  -- Get the calculated start date
  v_calculated_start := calculate_activity_start_date(v_activity_project_id, p_activity_id);

  -- If proposed date is before calculated date, there's a conflict
  IF p_proposed_start_date < v_calculated_start THEN
    -- Build warning message with details
    v_warning := 'Warning: Start date violates dependencies. ';
    
    FOR v_dep_name, v_dep_end_date, v_lag_days IN
      SELECT 
        pred.name,
        pred.end_date,
        COALESCE(dep.lag_days, 0)
      FROM activity_dependencies dep
      JOIN project_activities pred ON pred.id = dep.predecessor_id
      WHERE dep.successor_id = p_activity_id
        AND dep.dependency_type IN ('finish_to_start', 'start_to_start')
        AND pred.end_date IS NOT NULL
        AND p_proposed_start_date < (pred.end_date + COALESCE(dep.lag_days, 0))
    LOOP
      v_warning := v_warning || format('Activity "%s" ends on %s (+ %s days lag). ', 
        v_dep_name, v_dep_end_date, v_lag_days);
    END LOOP;
    
    v_warning := v_warning || format('Suggested start: %s', v_calculated_start);
  END IF;

  RETURN NULLIF(v_warning, '');
END;
$$;

-- Trigger function to auto-calculate dates when activities are created/updated
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
  -- Only calculate if start_date is not manually set OR if it's a new record
  IF NEW.is_date_override = false OR NEW.start_date IS NULL THEN
    -- Calculate start date based on dependencies
    v_calculated_start := calculate_activity_start_date(NEW.retrofit_project_id, NEW.id);
    NEW.start_date := v_calculated_start;
    NEW.is_date_override := false;
    NEW.override_warning := NULL;
  ELSE
    -- User manually set start date, check for conflicts
    v_warning := check_dependency_conflicts(NEW.id, NEW.start_date);
    NEW.override_warning := v_warning;
  END IF;

  -- Always calculate end date from start + duration
  IF NEW.start_date IS NOT NULL AND NEW.duration_days IS NOT NULL THEN
    NEW.end_date := NEW.start_date + NEW.duration_days;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for auto-calculating dates
DROP TRIGGER IF EXISTS trigger_calculate_activity_dates ON project_activities;
CREATE TRIGGER trigger_calculate_activity_dates
  BEFORE INSERT OR UPDATE OF duration_days, start_date, is_date_override
  ON project_activities
  FOR EACH ROW
  EXECUTE FUNCTION calculate_activity_dates();

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_project_activities_project_dates 
  ON project_activities(retrofit_project_id, start_date, end_date);

-- Comment on new fields
COMMENT ON COLUMN retrofit_projects.planned_start_date IS 'Overall project start date used for activity scheduling';
COMMENT ON COLUMN project_activities.duration_days IS 'Activity duration in days (mandatory field)';
COMMENT ON COLUMN project_activities.is_date_override IS 'True if user manually overrode the calculated start date';
COMMENT ON COLUMN project_activities.override_warning IS 'Warning message if date override violates dependencies';
