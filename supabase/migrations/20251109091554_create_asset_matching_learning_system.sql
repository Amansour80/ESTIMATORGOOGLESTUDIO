/*
  # Asset Matching Learning System

  ## Overview
  Creates a context learning system that tracks user corrections when matching uploaded assets
  to industry standard assets. The system learns from user behavior to improve future matching accuracy.

  ## New Tables

  ### `asset_matching_corrections`
  Stores user corrections when they manually select a different asset than the suggested match

  | Column | Type | Description |
  |--------|------|-------------|
  | id | uuid | Primary key |
  | organization_id | uuid | Organization that made the correction |
  | uploaded_text | text | The original text from uploaded file |
  | corrected_asset_id | uuid | The asset ID user actually selected |
  | frequency | integer | Number of times this correction was made |
  | last_used | timestamptz | When this correction was last applied |
  | created_at | timestamptz | First time this correction was recorded |
  | updated_at | timestamptz | Last update timestamp |

  ## Functions

  ### `record_asset_correction`
  Upserts a correction record, incrementing frequency if it already exists

  ## Security

  - RLS enabled on all tables
  - Users can only access corrections for their organization
  - Admins can view/manage all corrections in their organization
*/

-- Create asset matching corrections table
CREATE TABLE IF NOT EXISTS public.asset_matching_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_text text NOT NULL,
  corrected_asset_id uuid NOT NULL,
  frequency integer NOT NULL DEFAULT 1,
  last_used timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_asset_corrections_org_id
  ON public.asset_matching_corrections(organization_id);

CREATE INDEX IF NOT EXISTS idx_asset_corrections_uploaded_text
  ON public.asset_matching_corrections(organization_id, uploaded_text);

CREATE INDEX IF NOT EXISTS idx_asset_corrections_frequency
  ON public.asset_matching_corrections(organization_id, frequency DESC);

CREATE INDEX IF NOT EXISTS idx_asset_corrections_last_used
  ON public.asset_matching_corrections(last_used DESC);

-- Create unique constraint to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_asset_corrections_unique
  ON public.asset_matching_corrections(organization_id, uploaded_text, corrected_asset_id);

-- Enable RLS
ALTER TABLE public.asset_matching_corrections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view corrections for their organization"
  ON public.asset_matching_corrections
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert corrections for their organization"
  ON public.asset_matching_corrections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update corrections for their organization"
  ON public.asset_matching_corrections
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Function to record or update a correction
CREATE OR REPLACE FUNCTION public.record_asset_correction(
  p_organization_id uuid,
  p_uploaded_text text,
  p_corrected_asset_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.asset_matching_corrections (
    organization_id,
    uploaded_text,
    corrected_asset_id,
    frequency,
    last_used
  )
  VALUES (
    p_organization_id,
    p_uploaded_text,
    p_corrected_asset_id,
    1,
    now()
  )
  ON CONFLICT (organization_id, uploaded_text, corrected_asset_id)
  DO UPDATE SET
    frequency = asset_matching_corrections.frequency + 1,
    last_used = now(),
    updated_at = now();
END;
$$;

-- Function to clean up old/unused corrections (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_old_asset_corrections()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete corrections not used in 180 days with frequency = 1
  DELETE FROM public.asset_matching_corrections
  WHERE frequency = 1
    AND last_used < now() - interval '180 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$;

-- Add comment
COMMENT ON TABLE public.asset_matching_corrections IS 'Tracks user corrections for asset matching to improve future accuracy through machine learning';
COMMENT ON FUNCTION public.record_asset_correction IS 'Records or updates an asset matching correction, incrementing frequency counter';
COMMENT ON FUNCTION public.cleanup_old_asset_corrections IS 'Removes stale correction records (180+ days old with frequency=1)';