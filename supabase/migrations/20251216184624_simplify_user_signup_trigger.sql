/*
  # Simplify User Signup Trigger

  1. Changes
    - Remove pg_sleep and retry logic (not needed in same transaction)
    - System roles are created synchronously by trigger
    - Simplify error handling
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
