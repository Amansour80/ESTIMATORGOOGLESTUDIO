/*
  # Add Submission and PM Tracking Fields

  1. Changes to `inquiries` table
    - Add `response_date` - When first responded to inquiry
    - Add `conversion_date` - When converted to project
    - Add `decline_reason` - Reason if lost/declined
    - Add `declined_by` - User who declined

  2. Changes to `fm_projects`, `retrofit_projects`, `hk_projects` tables
    - Add `submitted_date` - Actual submission date to client
    - Add `expected_submission_date` - Planned submission deadline
    - Add `days_to_submit` - Calculated field
    - Add `is_on_time_submission` - Boolean flag
    - Add `expected_client_response_date` - When expecting client decision
    - Add `submission_notes` - Notes about submission
    - Add `actual_start_date` - Project execution start
    - Add `actual_end_date` - Project execution end
    - Add `completion_percentage` - Overall project completion
    - Add `health_status` - Project health (on_track, at_risk, delayed)
    - Add `budget_variance_percentage` - Budget performance
    - Add `schedule_variance_percentage` - Schedule performance

  3. Security
    - All fields follow existing RLS policies
*/

-- Add fields to inquiries table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inquiries' AND column_name = 'response_date'
  ) THEN
    ALTER TABLE inquiries ADD COLUMN response_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inquiries' AND column_name = 'conversion_date'
  ) THEN
    ALTER TABLE inquiries ADD COLUMN conversion_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inquiries' AND column_name = 'decline_reason'
  ) THEN
    ALTER TABLE inquiries ADD COLUMN decline_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inquiries' AND column_name = 'declined_by'
  ) THEN
    ALTER TABLE inquiries ADD COLUMN declined_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Add submission tracking fields to fm_projects
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fm_projects' AND column_name = 'submitted_date'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN submitted_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fm_projects' AND column_name = 'expected_submission_date'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN expected_submission_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fm_projects' AND column_name = 'days_to_submit'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN days_to_submit integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fm_projects' AND column_name = 'is_on_time_submission'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN is_on_time_submission boolean;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fm_projects' AND column_name = 'expected_client_response_date'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN expected_client_response_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fm_projects' AND column_name = 'submission_notes'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN submission_notes text;
  END IF;

  -- PM tracking fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fm_projects' AND column_name = 'actual_start_date'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN actual_start_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fm_projects' AND column_name = 'actual_end_date'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN actual_end_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fm_projects' AND column_name = 'completion_percentage'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN completion_percentage numeric(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fm_projects' AND column_name = 'health_status'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN health_status text DEFAULT 'on_track' CHECK (health_status IN ('on_track', 'at_risk', 'delayed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fm_projects' AND column_name = 'budget_variance_percentage'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN budget_variance_percentage numeric(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'fm_projects' AND column_name = 'schedule_variance_percentage'
  ) THEN
    ALTER TABLE fm_projects ADD COLUMN schedule_variance_percentage numeric(5,2);
  END IF;
END $$;

-- Add same fields to retrofit_projects
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retrofit_projects' AND column_name = 'submitted_date'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN submitted_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retrofit_projects' AND column_name = 'expected_submission_date'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN expected_submission_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retrofit_projects' AND column_name = 'days_to_submit'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN days_to_submit integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retrofit_projects' AND column_name = 'is_on_time_submission'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN is_on_time_submission boolean;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retrofit_projects' AND column_name = 'expected_client_response_date'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN expected_client_response_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retrofit_projects' AND column_name = 'submission_notes'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN submission_notes text;
  END IF;

  -- PM tracking fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retrofit_projects' AND column_name = 'actual_start_date'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN actual_start_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retrofit_projects' AND column_name = 'actual_end_date'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN actual_end_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retrofit_projects' AND column_name = 'completion_percentage'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN completion_percentage numeric(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retrofit_projects' AND column_name = 'health_status'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN health_status text DEFAULT 'on_track' CHECK (health_status IN ('on_track', 'at_risk', 'delayed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retrofit_projects' AND column_name = 'budget_variance_percentage'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN budget_variance_percentage numeric(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'retrofit_projects' AND column_name = 'schedule_variance_percentage'
  ) THEN
    ALTER TABLE retrofit_projects ADD COLUMN schedule_variance_percentage numeric(5,2);
  END IF;
END $$;

-- Add same fields to hk_projects
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hk_projects' AND column_name = 'submitted_date'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN submitted_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hk_projects' AND column_name = 'expected_submission_date'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN expected_submission_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hk_projects' AND column_name = 'days_to_submit'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN days_to_submit integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hk_projects' AND column_name = 'is_on_time_submission'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN is_on_time_submission boolean;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hk_projects' AND column_name = 'expected_client_response_date'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN expected_client_response_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hk_projects' AND column_name = 'submission_notes'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN submission_notes text;
  END IF;

  -- PM tracking fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hk_projects' AND column_name = 'actual_start_date'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN actual_start_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hk_projects' AND column_name = 'actual_end_date'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN actual_end_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hk_projects' AND column_name = 'completion_percentage'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN completion_percentage numeric(5,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hk_projects' AND column_name = 'health_status'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN health_status text DEFAULT 'on_track' CHECK (health_status IN ('on_track', 'at_risk', 'delayed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hk_projects' AND column_name = 'budget_variance_percentage'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN budget_variance_percentage numeric(5,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'hk_projects' AND column_name = 'schedule_variance_percentage'
  ) THEN
    ALTER TABLE hk_projects ADD COLUMN schedule_variance_percentage numeric(5,2);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inquiries_response_date ON inquiries(response_date);
CREATE INDEX IF NOT EXISTS idx_inquiries_conversion_date ON inquiries(conversion_date);

CREATE INDEX IF NOT EXISTS idx_fm_projects_submitted_date ON fm_projects(submitted_date);
CREATE INDEX IF NOT EXISTS idx_fm_projects_health_status ON fm_projects(health_status);

CREATE INDEX IF NOT EXISTS idx_retrofit_projects_submitted_date ON retrofit_projects(submitted_date);
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_health_status ON retrofit_projects(health_status);

CREATE INDEX IF NOT EXISTS idx_hk_projects_submitted_date ON hk_projects(submitted_date);
CREATE INDEX IF NOT EXISTS idx_hk_projects_health_status ON hk_projects(health_status);
