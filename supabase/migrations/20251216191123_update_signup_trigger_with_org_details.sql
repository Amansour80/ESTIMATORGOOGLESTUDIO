/*
  # Update Signup Trigger to Use Organization Details

  1. Changes
    - Update handle_new_user_complete to extract organization details from user metadata
    - Populate organization fields: name, industry, company_size, country, phone, website
    - Fall back to defaults if metadata is missing
  
  2. Purpose
    - Capture organization details during sign-up for business intelligence
    - Ensure all new organizations have complete profile data
*/

CREATE OR REPLACE FUNCTION public.handle_new_user_complete()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  owner_role_id uuid;
  org_name text;
  org_industry text;
  org_company_size text;
  org_country text;
  org_phone text;
  org_website text;
BEGIN
  -- Extract organization details from user metadata
  org_name := COALESCE(
    NEW.raw_user_meta_data->>'organization_name',
    split_part(NEW.email, '@', 1) || '''s Organization'
  );
  org_industry := NEW.raw_user_meta_data->>'industry';
  org_company_size := NEW.raw_user_meta_data->>'company_size';
  org_country := NEW.raw_user_meta_data->>'country';
  org_phone := NEW.raw_user_meta_data->>'phone';
  org_website := NEW.raw_user_meta_data->>'website';

  -- Create user profile first (idempotent)
  INSERT INTO public.user_profiles (id, full_name, complementary_account)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''), 
    false
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create organization and related records only if user is not already a member
  IF NOT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = NEW.id) THEN
    -- Create organization with full details
    INSERT INTO public.organizations (
      name,
      industry,
      company_size,
      country,
      phone,
      website
    )
    VALUES (
      org_name,
      org_industry,
      org_company_size,
      org_country,
      org_phone,
      org_website
    )
    RETURNING id INTO new_org_id;

    -- Add user as owner in organization_members
    INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
    VALUES (new_org_id, NEW.id, 'owner', 'active', now());

    -- Create free subscription with feature limits
    INSERT INTO public.subscriptions (
      organization_id, 
      plan, 
      user_limit, 
      amount, 
      status,
      feature_limits
    )
    VALUES (
      new_org_id, 
      'free', 
      1, 
      0, 
      'active',
      '{
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
    );

    -- System roles should now exist (created by trigger on organizations)
    -- Find and assign Owner role
    SELECT id INTO owner_role_id
    FROM public.organization_roles
    WHERE organization_id = new_org_id
      AND role_type = 'system'
      AND role_name = 'Owner'
    LIMIT 1;

    -- If Owner role exists, assign it to the user
    IF owner_role_id IS NOT NULL THEN
      INSERT INTO public.user_role_assignments (
        organization_id,
        user_id,
        role_id,
        is_active
      )
      VALUES (
        new_org_id,
        NEW.id,
        owner_role_id,
        true
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the user creation
  RAISE WARNING 'Error in handle_new_user_complete: % %', SQLERRM, SQLSTATE;
  RETURN NEW;
END;
$$;