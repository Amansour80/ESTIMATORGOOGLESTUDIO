/*
  # Fix Finish-to-Start Lag Calculation

  Fixes an off-by-one error in the Finish-to-Start dependency calculation.
  
  When Activity A finishes on Day X, Activity B should start on Day X+1 at the earliest.
  With a lag of N days, Activity B should start on Day X+1+N.
  
  Example: Activity A ends Jan 18, lag = 3 days
  - Correct: Activity B starts Jan 22 (Jan 18 + 1 day + 3 days lag)
  - Previous (wrong): Activity B starts Jan 21 (Jan 18 + 3 days lag)
  
  This fixes both the calculation and conflict checking functions.
*/

-- Fix the calculate_activity_start_date function
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
        -- Successor starts after predecessor finishes + lag + 1 day
        -- (because the predecessor finishes ON that day, successor starts the NEXT day)
        IF v_dep_end_date + v_lag_days + 1 > v_latest_date THEN
          v_latest_date := v_dep_end_date + v_lag_days + 1;
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

-- Fix the check_dependency_conflicts function to use the same logic
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
  v_required_date date;
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
    LOOP
      -- Calculate required date (with +1 for finish_to_start)
      v_required_date := v_dep_end_date + v_lag_days + 1;
      
      IF p_proposed_start_date < v_required_date THEN
        v_warning := v_warning || format('Activity "%s" ends on %s (+ %s days lag). ', 
          v_dep_name, v_dep_end_date, v_lag_days);
      END IF;
    END LOOP;
    
    v_warning := v_warning || format('Suggested start: %s', v_calculated_start);
  END IF;

  RETURN NULLIF(v_warning, '');
END;
$$;

-- Add comment explaining the logic
COMMENT ON FUNCTION calculate_activity_start_date IS 'Calculates activity start date based on dependencies. For Finish-to-Start, adds lag_days + 1 because the successor must start AFTER the predecessor finishes (not on the same day).';
