/*
  # Add Lag Days to Activity Dependencies

  1. Changes to Tables
    - Add `lag_days` column to activity_dependencies table
    - Lag represents the delay (in days) between predecessor and successor activities
    
  2. Features
    - Positive values represent lag (delay): successor starts X days after predecessor completes
    - Negative values represent lead (advance): successor can start X days before predecessor completes
    - Default is 0 (no lag/lead)
    
  3. Example
    - Activity A ends on Jan 5
    - Activity B depends on A with lag_days = 2
    - Activity B can start on Jan 8 (5 + 2 + 1 = 8th)
*/

-- Add lag_days column to activity_dependencies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'activity_dependencies' AND column_name = 'lag_days'
  ) THEN
    ALTER TABLE activity_dependencies 
      ADD COLUMN lag_days int DEFAULT 0 NOT NULL
      CHECK (lag_days >= -365 AND lag_days <= 365);
  END IF;
END $$;

-- Add comment to explain the lag_days column
COMMENT ON COLUMN activity_dependencies.lag_days IS 'Lag (positive) or lead (negative) time in days between predecessor and successor. 0 = immediate succession.';
