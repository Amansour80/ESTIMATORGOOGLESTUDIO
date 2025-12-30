/*
  # Add Supervisory Capability to FM Technicians

  ## Changes
  - Add `can_supervise` boolean column to `org_fm_technicians` table
  - Default value is `false` for most technicians
  - Update existing records to set appropriate supervision capability based on role names

  ## Rationale
  - Only certain roles (managers, supervisors, engineers) should be available for supervision/support roles
  - This prevents technicians from being assigned to supervisory positions

  ## Notes
  - Technicians with "Manager", "Supervisor", "Engineer", "Lead" in their names will be set to can_supervise = true
  - All others default to false
*/

-- Add can_supervise column to org_fm_technicians
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_fm_technicians' AND column_name = 'can_supervise'
  ) THEN
    ALTER TABLE org_fm_technicians 
    ADD COLUMN can_supervise boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Update existing records to set supervision capability based on common role names
UPDATE org_fm_technicians
SET can_supervise = true
WHERE LOWER(name) LIKE '%manager%'
   OR LOWER(name) LIKE '%supervisor%'
   OR LOWER(name) LIKE '%engineer%'
   OR LOWER(name) LIKE '%lead%'
   OR LOWER(name) LIKE '%chief%'
   OR LOWER(name) LIKE '%head%';
