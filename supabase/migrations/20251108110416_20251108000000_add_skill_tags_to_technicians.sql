/*
  # Add Skill Tags to Technician Tables

  1. Changes
    - Add `skill_tags` column to `org_fm_technicians` (text array for multiple skills)
    - Add `skill_tags` column to `org_retrofit_labor` (text array for multiple skills)
    - Add `skill_tags` column to `org_cleaners` (text array for multiple skills)
    - Add `can_supervise` column to `org_fm_technicians` (boolean, default false)
    - Add `input_base_count` column to `org_fm_technicians` (numeric, default 0)
    - Add `notes` column to `org_fm_technicians` (text, default '')

  2. Purpose
    - Enable skill-based technician matching for auto-assignment
    - Support standardized skill tags across different organization naming conventions
    - Predefined skill tags: hvac, chiller, ahu, fcu, ventilation, ac, electrical,
      lighting, power, ups, generator, low-voltage, plumbing, sanitary, drainage,
      water-supply, sewage, mechanical, elevator, escalator, conveyors, motors,
      fire-alarm, sprinkler, fire-suppression, safety-systems, bms, automation,
      controls, scada, smart-building, access-control, cctv, security, gates,
      barriers, civil, painting, flooring, tiles, waterproofing, carpentry, doors,
      furniture, joinery, general-maintenance, handyman, multi-skilled

  3. Notes
    - Existing technicians will have empty skill_tags arrays (user must configure)
    - Auto-assignment will use skill_tags instead of technician name matching
    - Supervisors can be excluded from auto-assignment using can_supervise flag
*/

-- Add skill_tags column to org_fm_technicians
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_fm_technicians' AND column_name = 'skill_tags'
  ) THEN
    ALTER TABLE org_fm_technicians ADD COLUMN skill_tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Add can_supervise column to org_fm_technicians
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_fm_technicians' AND column_name = 'can_supervise'
  ) THEN
    ALTER TABLE org_fm_technicians ADD COLUMN can_supervise boolean DEFAULT false;
  END IF;
END $$;

-- Add input_base_count column to org_fm_technicians
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_fm_technicians' AND column_name = 'input_base_count'
  ) THEN
    ALTER TABLE org_fm_technicians ADD COLUMN input_base_count numeric DEFAULT 0;
  END IF;
END $$;

-- Add notes column to org_fm_technicians
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_fm_technicians' AND column_name = 'notes'
  ) THEN
    ALTER TABLE org_fm_technicians ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;

-- Add skill_tags column to org_retrofit_labor
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_retrofit_labor' AND column_name = 'skill_tags'
  ) THEN
    ALTER TABLE org_retrofit_labor ADD COLUMN skill_tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Add skill_tags column to org_cleaners
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'org_cleaners' AND column_name = 'skill_tags'
  ) THEN
    ALTER TABLE org_cleaners ADD COLUMN skill_tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Create index for faster skill_tags queries
CREATE INDEX IF NOT EXISTS idx_org_fm_technicians_skill_tags ON org_fm_technicians USING gin(skill_tags);
CREATE INDEX IF NOT EXISTS idx_org_retrofit_labor_skill_tags ON org_retrofit_labor USING gin(skill_tags);
CREATE INDEX IF NOT EXISTS idx_org_cleaners_skill_tags ON org_cleaners USING gin(skill_tags);
