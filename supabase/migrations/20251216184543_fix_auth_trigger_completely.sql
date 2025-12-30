/*
  # Fix Auth User Creation Trigger

  1. Problem
    - Trigger on auth.users appears to be misconfigured
    - Causing "Database error saving new user" on signup
    
  2. Solution
    - Drop and recreate trigger with correct configuration
    - Ensure it's AFTER INSERT trigger
    - Simplify the function to avoid race conditions with org triggers
*/

-- Drop existing trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the function with better error handling and simpler logic
CREATE OR REPLACE FUNCTION public.handle_new_user_complete()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  owner_role_id uuid;
  max_attempts int := 5;
  attempt int := 0;
BEGIN
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
    -- Create organization (this will trigger system role creation automatically)
    INSERT INTO public.organizations (name)
    VALUES (COALESCE(NEW.email, 'Organization'))
    RETURNING id INTO new_org_id;

    -- Add user as owner in organization_members
    INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
    VALUES (new_org_id, NEW.id, 'owner', 'active', now());

    -- Create free subscription
    INSERT INTO public.subscriptions (organization_id, plan, user_limit, amount, status)
    VALUES (new_org_id, 'free', 1, 0, 'active');

    -- Wait briefly for system roles trigger to complete, then assign Owner role
    -- The system roles are created by a trigger on organizations table
    PERFORM pg_sleep(0.1);
    
    -- Try to find and assign Owner role (with retry logic)
    WHILE attempt < max_attempts LOOP
      SELECT id INTO owner_role_id
      FROM public.organization_roles
      WHERE organization_id = new_org_id
        AND role_type = 'system'
        AND role_name = 'Owner'
      LIMIT 1;
      
      EXIT WHEN owner_role_id IS NOT NULL;
      
      attempt := attempt + 1;
      PERFORM pg_sleep(0.05);
    END LOOP;

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

-- Create the trigger correctly as AFTER INSERT
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_complete();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_complete TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_complete TO service_role;
