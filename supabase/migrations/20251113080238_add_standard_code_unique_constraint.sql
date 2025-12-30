/*
  # Add Unique Constraint for Standard Code

  1. Changes
    - Add unique constraint on `standard_code` column in `industry_standard_asset_library` table
    - Only enforces uniqueness when standard_code is not null
    - Prevents duplicate asset codes in the library

  2. Notes
    - Uses a unique index with a WHERE clause to allow multiple NULL values
    - This ensures code uniqueness while allowing assets without codes
*/

-- Add unique constraint for standard_code (excluding NULL values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_industry_standard_asset_library_standard_code_unique
  ON public.industry_standard_asset_library(standard_code)
  WHERE standard_code IS NOT NULL;