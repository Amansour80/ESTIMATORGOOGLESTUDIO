/*
  # Add BOQ Mode Support to Retrofit Projects

  1. Changes
    - Add `estimation_mode` column to retrofit_projects table
      - Default: 'standard'
      - Options: 'standard' or 'boq'
      - Locked once project is saved
    - Add `boq_line_items` JSONB column to store BOQ data
      - Stores array of BOQ line items with all details
      - Includes category, description, quantities, costs, labor/supervision details
    
  2. Notes
    - estimation_mode is immutable after first save (enforced in application logic)
    - boq_line_items is only populated when estimation_mode = 'boq'
    - All calculations are performed client-side for real-time updates
*/

-- Add estimation mode column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retrofit_projects' AND column_name = 'estimation_mode'
  ) THEN
    ALTER TABLE retrofit_projects 
    ADD COLUMN estimation_mode text DEFAULT 'standard' 
    CHECK (estimation_mode IN ('standard', 'boq'));
  END IF;
END $$;

-- Add BOQ line items column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'retrofit_projects' AND column_name = 'boq_line_items'
  ) THEN
    ALTER TABLE retrofit_projects 
    ADD COLUMN boq_line_items jsonb DEFAULT NULL;
  END IF;
END $$;

-- Create index on estimation_mode for faster filtering
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_estimation_mode 
ON retrofit_projects(estimation_mode);

-- Create GIN index on boq_line_items for JSONB queries
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_boq_line_items 
ON retrofit_projects USING GIN(boq_line_items);