/*
  # Create Usage Tracking System for Freemium Model

  1. New Tables
    - `usage_tracking`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, foreign key to organizations)
      - `projects_count` (integer) - Total active projects across all types
      - `inquiries_count` (integer) - Inquiries created this month
      - `last_inquiry_reset` (timestamptz) - Last time inquiry count was reset
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Feature Limits Configuration
    - Add `feature_limits` jsonb column to subscriptions table to store tier limits
  
  3. Helper Functions
    - `get_organization_usage` - Get current usage stats
    - `check_project_limit` - Check if org can create more projects
    - `check_inquiry_limit` - Check if org can create more inquiries
  
  4. Triggers
    - Auto-update usage counters on project/inquiry creation and deletion
  
  5. Security
    - Enable RLS on usage_tracking
    - Allow users to read their organization's usage
*/

-- Create usage_tracking table
CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  projects_count integer DEFAULT 0 NOT NULL,
  inquiries_count integer DEFAULT 0 NOT NULL,
  last_inquiry_reset timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add feature_limits to subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'feature_limits'
  ) THEN
    ALTER TABLE public.subscriptions ADD COLUMN feature_limits jsonb DEFAULT '{
      "max_projects": null,
      "max_inquiries_per_month": null,
      "max_users": null,
      "has_watermark": false,
      "can_export_excel": true,
      "can_use_workflows": true,
      "can_use_dashboard": true,
      "can_use_comparison": true,
      "can_manage_libraries": true,
      "data_retention_days": null
    }'::jsonb;
  END IF;
END $$;

-- Set feature limits for existing free plans
UPDATE public.subscriptions
SET feature_limits = '{
  "max_projects": 3,
  "max_inquiries_per_month": 5,
  "max_users": 1,
  "has_watermark": true,
  "can_export_excel": true,
  "can_use_workflows": false,
  "can_use_dashboard": false,
  "can_use_comparison": false,
  "can_manage_libraries": false,
  "data_retention_days": 30
}'::jsonb
WHERE plan = 'free';

-- Enable RLS
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for usage_tracking
CREATE POLICY "Users can view their organization usage"
  ON public.usage_tracking
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_usage_tracking_organization_id ON public.usage_tracking(organization_id);

-- Function to get organization usage
CREATE OR REPLACE FUNCTION public.get_organization_usage(org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_data jsonb;
  limits_data jsonb;
  actual_projects_count integer;
  actual_inquiries_count integer;
BEGIN
  -- Get actual project count
  SELECT COUNT(*) INTO actual_projects_count
  FROM (
    SELECT id FROM public.fm_projects WHERE organization_id = org_id
    UNION ALL
    SELECT id FROM public.retrofit_projects WHERE organization_id = org_id
    UNION ALL
    SELECT id FROM public.hk_projects WHERE organization_id = org_id
  ) all_projects;

  -- Get actual inquiry count for current month
  SELECT COUNT(*) INTO actual_inquiries_count
  FROM public.inquiries
  WHERE organization_id = org_id
    AND created_at >= date_trunc('month', now());

  -- Get or create usage tracking record
  INSERT INTO public.usage_tracking (organization_id, projects_count, inquiries_count)
  VALUES (org_id, actual_projects_count, actual_inquiries_count)
  ON CONFLICT (organization_id)
  DO UPDATE SET
    projects_count = actual_projects_count,
    inquiries_count = CASE
      WHEN date_trunc('month', usage_tracking.last_inquiry_reset) < date_trunc('month', now())
      THEN actual_inquiries_count
      ELSE usage_tracking.inquiries_count
    END,
    last_inquiry_reset = CASE
      WHEN date_trunc('month', usage_tracking.last_inquiry_reset) < date_trunc('month', now())
      THEN now()
      ELSE usage_tracking.last_inquiry_reset
    END,
    updated_at = now();

  -- Get feature limits from subscription
  SELECT feature_limits INTO limits_data
  FROM public.subscriptions s
  JOIN public.organizations o ON o.id = org_id
  WHERE s.organization_id = o.id;

  -- Get updated usage
  SELECT jsonb_build_object(
    'projects_count', ut.projects_count,
    'inquiries_count', ut.inquiries_count,
    'last_inquiry_reset', ut.last_inquiry_reset,
    'limits', limits_data
  ) INTO usage_data
  FROM public.usage_tracking ut
  WHERE ut.organization_id = org_id;

  RETURN usage_data;
END;
$$;

-- Function to check if organization can create a project
CREATE OR REPLACE FUNCTION public.check_project_limit(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  max_projects integer;
BEGIN
  -- Get current project count
  SELECT COUNT(*) INTO current_count
  FROM (
    SELECT id FROM public.fm_projects WHERE organization_id = org_id
    UNION ALL
    SELECT id FROM public.retrofit_projects WHERE organization_id = org_id
    UNION ALL
    SELECT id FROM public.hk_projects WHERE organization_id = org_id
  ) all_projects;

  -- Get max projects from subscription
  SELECT (feature_limits->>'max_projects')::integer INTO max_projects
  FROM public.subscriptions s
  JOIN public.organizations o ON s.organization_id = o.id
  WHERE o.id = org_id;

  -- If max_projects is null, unlimited
  IF max_projects IS NULL THEN
    RETURN true;
  END IF;

  RETURN current_count < max_projects;
END;
$$;

-- Function to check if organization can create an inquiry
CREATE OR REPLACE FUNCTION public.check_inquiry_limit(org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  max_inquiries integer;
  usage_record RECORD;
BEGIN
  -- Get or create usage record
  SELECT * INTO usage_record
  FROM public.usage_tracking
  WHERE organization_id = org_id;

  IF usage_record IS NULL THEN
    INSERT INTO public.usage_tracking (organization_id, inquiries_count)
    VALUES (org_id, 0)
    RETURNING * INTO usage_record;
  END IF;

  -- Reset if new month
  IF date_trunc('month', usage_record.last_inquiry_reset) < date_trunc('month', now()) THEN
    UPDATE public.usage_tracking
    SET inquiries_count = 0,
        last_inquiry_reset = now(),
        updated_at = now()
    WHERE organization_id = org_id
    RETURNING * INTO usage_record;
  END IF;

  current_count := usage_record.inquiries_count;

  -- Get max inquiries from subscription
  SELECT (feature_limits->>'max_inquiries_per_month')::integer INTO max_inquiries
  FROM public.subscriptions s
  JOIN public.organizations o ON s.organization_id = o.id
  WHERE o.id = org_id;

  -- If max_inquiries is null, unlimited
  IF max_inquiries IS NULL THEN
    RETURN true;
  END IF;

  RETURN current_count < max_inquiries;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_organization_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_project_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_inquiry_limit(uuid) TO authenticated;

-- Create trigger to update usage on project creation
CREATE OR REPLACE FUNCTION public.update_project_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_tracking (organization_id, projects_count)
  VALUES (NEW.organization_id, 1)
  ON CONFLICT (organization_id)
  DO UPDATE SET
    projects_count = (
      SELECT COUNT(*) FROM (
        SELECT id FROM public.fm_projects WHERE organization_id = NEW.organization_id
        UNION ALL
        SELECT id FROM public.retrofit_projects WHERE organization_id = NEW.organization_id
        UNION ALL
        SELECT id FROM public.hk_projects WHERE organization_id = NEW.organization_id
      ) all_projects
    ),
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger to update usage on inquiry creation
CREATE OR REPLACE FUNCTION public.update_inquiry_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_record RECORD;
BEGIN
  SELECT * INTO usage_record
  FROM public.usage_tracking
  WHERE organization_id = NEW.organization_id;

  IF usage_record IS NULL THEN
    INSERT INTO public.usage_tracking (organization_id, inquiries_count)
    VALUES (NEW.organization_id, 1);
  ELSE
    IF date_trunc('month', usage_record.last_inquiry_reset) < date_trunc('month', now()) THEN
      UPDATE public.usage_tracking
      SET inquiries_count = 1,
          last_inquiry_reset = now(),
          updated_at = now()
      WHERE organization_id = NEW.organization_id;
    ELSE
      UPDATE public.usage_tracking
      SET inquiries_count = inquiries_count + 1,
          updated_at = now()
      WHERE organization_id = NEW.organization_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attach triggers to all project tables
DROP TRIGGER IF EXISTS trigger_update_project_usage_fm ON public.fm_projects;
CREATE TRIGGER trigger_update_project_usage_fm
  AFTER INSERT ON public.fm_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_usage();

DROP TRIGGER IF EXISTS trigger_update_project_usage_retrofit ON public.retrofit_projects;
CREATE TRIGGER trigger_update_project_usage_retrofit
  AFTER INSERT ON public.retrofit_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_usage();

DROP TRIGGER IF EXISTS trigger_update_project_usage_hk ON public.hk_projects;
CREATE TRIGGER trigger_update_project_usage_hk
  AFTER INSERT ON public.hk_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_usage();

DROP TRIGGER IF EXISTS trigger_update_inquiry_usage ON public.inquiries;
CREATE TRIGGER trigger_update_inquiry_usage
  AFTER INSERT ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_inquiry_usage();

-- Trigger to update usage on project deletion
CREATE OR REPLACE FUNCTION public.update_project_usage_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.usage_tracking
  SET projects_count = (
    SELECT COUNT(*) FROM (
      SELECT id FROM public.fm_projects WHERE organization_id = OLD.organization_id
      UNION ALL
      SELECT id FROM public.retrofit_projects WHERE organization_id = OLD.organization_id
      UNION ALL
      SELECT id FROM public.hk_projects WHERE organization_id = OLD.organization_id
    ) all_projects
  ),
  updated_at = now()
  WHERE organization_id = OLD.organization_id;
  
  RETURN OLD;
END;
$$;

-- Attach delete triggers
DROP TRIGGER IF EXISTS trigger_update_project_usage_fm_delete ON public.fm_projects;
CREATE TRIGGER trigger_update_project_usage_fm_delete
  AFTER DELETE ON public.fm_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_usage_on_delete();

DROP TRIGGER IF EXISTS trigger_update_project_usage_retrofit_delete ON public.retrofit_projects;
CREATE TRIGGER trigger_update_project_usage_retrofit_delete
  AFTER DELETE ON public.retrofit_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_usage_on_delete();

DROP TRIGGER IF EXISTS trigger_update_project_usage_hk_delete ON public.hk_projects;
CREATE TRIGGER trigger_update_project_usage_hk_delete
  AFTER DELETE ON public.hk_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_project_usage_on_delete();