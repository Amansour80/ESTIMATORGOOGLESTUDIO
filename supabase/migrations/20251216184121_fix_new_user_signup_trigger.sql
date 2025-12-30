/*
  # Fix New User Signup Trigger

  1. Problem
    - Function references non-existent columns (created_by in organizations, tier in subscriptions)
    - Causes "Database error saving new user" on signup
    
  2. Solution
    - Update function to use correct column names from current schema
    - organizations: just name (no created_by)
    - subscriptions: plan (not tier)
*/

CREATE OR REPLACE FUNCTION public.handle_new_user_complete()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create user profile first
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = NEW.id) THEN
    INSERT INTO public.user_profiles (id, full_name, complementary_account)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, ''), 
      false
    );
  END IF;

  -- Create organization and related records only if user is not already a member
  IF NOT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = NEW.id) THEN
    -- Create organization
    INSERT INTO public.organizations (name)
    VALUES (COALESCE(NEW.email, 'Organization'))
    RETURNING id INTO new_org_id;

    -- Add user as owner
    INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
    VALUES (new_org_id, NEW.id, 'owner', 'active', now());

    -- Create free subscription
    INSERT INTO public.subscriptions (organization_id, plan, user_limit, amount, status)
    VALUES (new_org_id, 'free', 1, 0, 'active');
  END IF;

  RETURN NEW;
END;
$$;
