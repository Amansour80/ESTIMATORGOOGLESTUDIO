/*
  # Rename SFG20 Tables to Industry Standard Library

  1. Changes
    - Rename `sfg20_asset_library` to `industry_standard_asset_library`
    - Rename `sfg20_ppm_tasks` to `industry_standard_ppm_tasks`
    - Rename column `sfg20_code` to `standard_code`
    - Update all foreign key constraints
    - Maintain all existing data and relationships

  2. Security
    - Preserve all existing RLS policies
    - Update policy references to new table names
*/

-- Rename the tables
ALTER TABLE IF EXISTS sfg20_asset_library RENAME TO industry_standard_asset_library;
ALTER TABLE IF EXISTS sfg20_ppm_tasks RENAME TO industry_standard_ppm_tasks;

-- Rename the sfg20_code column to standard_code
ALTER TABLE IF EXISTS industry_standard_asset_library 
RENAME COLUMN sfg20_code TO standard_code;

-- Update indexes (they are automatically renamed with the table)
-- But we should rename them explicitly for clarity
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sfg20_asset_category') THEN
    ALTER INDEX idx_sfg20_asset_category RENAME TO idx_industry_standard_asset_category;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sfg20_asset_code') THEN
    ALTER INDEX idx_sfg20_asset_code RENAME TO idx_industry_standard_asset_code;
  END IF;
END $$;
