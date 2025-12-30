/*
  # Fix email verification trigger issue

  1. Problem
    - Email verification may trigger the function again
    - This causes errors if organization already exists

  2. Solution
    - Add checks to prevent duplicate creation
    - Only create organization if user doesn't already have one
    - Make function idempotent

  3. Changes
    - Check if user already has an organization before creating
    - Use ON CONFLICT to handle duplicates gracefully
*/

CREATE OR REPLACE FUNCTION handle_new_user_complete()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id uuid;
  existing_org_id uuid;
BEGIN
  -- Check if user already has an organization
  SELECT organization_id INTO existing_org_id
  FROM public.organization_members
  WHERE user_id = NEW.id
  LIMIT 1;

  -- Only create organization if user doesn't have one
  IF existing_org_id IS NULL THEN
    -- Create organization
    INSERT INTO public.organizations (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Organization'))
    RETURNING id INTO new_org_id;
    
    -- Add user as owner
    INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
    VALUES (new_org_id, NEW.id, 'owner', 'active', now())
    ON CONFLICT (organization_id, user_id) DO NOTHING;
    
    -- Create free subscription
    INSERT INTO public.subscriptions (organization_id, plan, user_limit, amount, status)
    VALUES (new_org_id, 'free', 1, 0, 'active')
    ON CONFLICT (organization_id) DO NOTHING;
  END IF;
  
  -- Always ensure user profile exists (idempotent)
  INSERT INTO public.user_profiles (id, complementary_account, created_by)
  VALUES (NEW.id, false, NULL)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the authentication
    RAISE WARNING 'Error in handle_new_user_complete: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;