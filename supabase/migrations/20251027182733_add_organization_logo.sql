/*
  # Add Organization Logo Support

  1. Changes
    - Add `logo_url` column to `organizations` table to store the Supabase Storage URL
    - Column is optional (nullable) to support organizations without logos
  
  2. Notes
    - Logo files will be stored in Supabase Storage bucket 'organization-logos'
    - URL will point to the public URL of the uploaded logo
    - Storage bucket and RLS policies will be configured separately
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE organizations ADD COLUMN logo_url TEXT;
  END IF;
END $$;
