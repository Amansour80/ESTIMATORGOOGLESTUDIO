/*
  # Update Technician Library for Deployment Model Support

  ## Changes

  1. Schema Updates (org_fm_technicians)
    - Rename `monthly_benefits` to `additional_cost`
    - Add `hourly_rate` column (auto-calculated as CTC / 208 hours)
    - Remove `deployment_model` column (now determined by project type)
    - Add `skill_tags` array for intelligent matching

  2. Schema Updates (org_retrofit_labor, org_cleaners)
    - Rename `monthly_benefits` to `additional_cost`
    - Add `hourly_rate` column

  3. Rationale
    - Support both resident (monthly) and rotating (hourly) deployment models
    - CTC (Cost To Company) = monthly_salary + additional_cost
    - Hourly rate for output-based projects = CTC / 208 hours
    - Input-based projects use monthly CTC directly
    - Deployment model determined by project type + critical flag

  4. Notes
    - Existing data preserved
    - hourly_rate can be NULL (will be calculated on frontend)
    - Both rates stored for flexibility and performance
*/

-- Update org_fm_technicians table
DO $$
BEGIN
  -- Rename monthly_benefits to additional_cost
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_fm_technicians' AND column_name = 'monthly_benefits'
  ) THEN
    ALTER TABLE org_fm_technicians
    RENAME COLUMN monthly_benefits TO additional_cost;
  END IF;

  -- Add hourly_rate column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_fm_technicians' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE org_fm_technicians
    ADD COLUMN hourly_rate numeric;
  END IF;

  -- Remove deployment_model column (no longer needed)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_fm_technicians' AND column_name = 'deployment_model'
  ) THEN
    ALTER TABLE org_fm_technicians
    DROP COLUMN deployment_model;
  END IF;
END $$;

-- Update org_retrofit_labor table
DO $$
BEGIN
  -- Rename monthly_benefits to additional_cost
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_retrofit_labor' AND column_name = 'monthly_benefits'
  ) THEN
    ALTER TABLE org_retrofit_labor
    RENAME COLUMN monthly_benefits TO additional_cost;
  END IF;

  -- Add hourly_rate column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_retrofit_labor' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE org_retrofit_labor
    ADD COLUMN hourly_rate numeric;
  END IF;
END $$;

-- Update org_cleaners table
DO $$
BEGIN
  -- Rename monthly_benefits to additional_cost
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_cleaners' AND column_name = 'monthly_benefits'
  ) THEN
    ALTER TABLE org_cleaners
    RENAME COLUMN monthly_benefits TO additional_cost;
  END IF;

  -- Add hourly_rate column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_cleaners' AND column_name = 'hourly_rate'
  ) THEN
    ALTER TABLE org_cleaners
    ADD COLUMN hourly_rate numeric;
  END IF;
END $$;

-- Add comments explaining the calculations
COMMENT ON COLUMN org_fm_technicians.hourly_rate IS
  'Hourly rate for rotating/output-based deployment. Calculated as (monthly_salary + additional_cost) / 208 hours';

COMMENT ON COLUMN org_fm_technicians.additional_cost IS
  'Additional costs beyond base salary (insurance, benefits, etc). Combined with monthly_salary forms CTC (Cost To Company)';

COMMENT ON COLUMN org_retrofit_labor.hourly_rate IS
  'Hourly rate for rotating/output-based deployment. Calculated as (monthly_salary + additional_cost) / 208 hours';

COMMENT ON COLUMN org_retrofit_labor.additional_cost IS
  'Additional costs beyond base salary (insurance, benefits, etc). Combined with monthly_salary forms CTC (Cost To Company)';

COMMENT ON COLUMN org_cleaners.hourly_rate IS
  'Hourly rate for rotating/output-based deployment. Calculated as (monthly_salary + additional_cost) / 208 hours';

COMMENT ON COLUMN org_cleaners.additional_cost IS
  'Additional costs beyond base salary (insurance, benefits, etc). Combined with monthly_salary forms CTC (Cost To Company)';
