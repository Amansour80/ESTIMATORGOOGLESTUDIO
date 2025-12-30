/*
  # Add Business Details to Organizations

  1. Changes to organizations table
    - Add `industry` field for sector/industry type
    - Add `company_size` field for number of employees
    - Add `phone` field for contact number
    - Add `country` field for geographic location
    - Add `website` field for company website
  
  2. Purpose
    - Collect valuable business intelligence during sign-up
    - Enable better customer segmentation and analysis
    - Understand target markets and customer profiles
*/

-- Add new columns to organizations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'industry'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN industry text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'company_size'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN company_size text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'country'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN country text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'website'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN website text;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.organizations.industry IS 'Industry/sector of the organization (e.g., Facilities Management, Construction, Real Estate)';
COMMENT ON COLUMN public.organizations.company_size IS 'Number of employees (e.g., 1-10, 11-50, 51-200, 201-500, 500+)';
COMMENT ON COLUMN public.organizations.phone IS 'Primary contact phone number';
COMMENT ON COLUMN public.organizations.country IS 'Country where organization is based';
COMMENT ON COLUMN public.organizations.website IS 'Company website URL';