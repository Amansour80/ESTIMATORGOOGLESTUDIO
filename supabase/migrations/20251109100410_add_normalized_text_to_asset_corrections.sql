/*
  # Add normalized text field to asset matching corrections

  1. Changes
    - Add `normalized_text` column to `asset_matching_corrections` table
    - This will store preprocessed/normalized version of uploaded_text for better matching
    - Add index on normalized_text for faster lookups

  2. Notes
    - Used for improved asset matching with typo correction and normalization
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'asset_matching_corrections' AND column_name = 'normalized_text'
  ) THEN
    ALTER TABLE public.asset_matching_corrections 
    ADD COLUMN normalized_text text;
    
    CREATE INDEX IF NOT EXISTS idx_asset_corrections_normalized 
    ON public.asset_matching_corrections(organization_id, normalized_text);
  END IF;
END $$;