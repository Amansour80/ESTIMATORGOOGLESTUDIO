/*
  # Fix Existing Users - Create Organizations

  This migration ensures all existing users have an organization, organization membership, and subscription.
  
  1. Creates organizations for users who don't have one
  2. Adds them as owners to their organization
  3. Creates free tier subscriptions for them
  
  This is needed because the trigger only works for NEW users, not existing ones.
*/

-- Create organizations, memberships, and subscriptions for existing users
DO $$
DECLARE
  user_record RECORD;
  new_org_id uuid;
BEGIN
  -- Loop through all users who don't have an organization
  FOR user_record IN 
    SELECT DISTINCT u.id, u.email, u.raw_user_meta_data
    FROM auth.users u
    LEFT JOIN organization_members om ON om.user_id = u.id
    WHERE om.id IS NULL
  LOOP
    -- Create organization
    INSERT INTO organizations (name)
    VALUES (COALESCE(user_record.raw_user_meta_data->>'company_name', 'My Organization'))
    RETURNING id INTO new_org_id;
    
    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
    VALUES (new_org_id, user_record.id, 'owner', 'active', now());
    
    -- Create free subscription
    INSERT INTO subscriptions (organization_id, plan, user_limit, amount, status)
    VALUES (new_org_id, 'free', 1, 0, 'active');
    
    RAISE NOTICE 'Created organization for user: %', user_record.email;
  END LOOP;
END $$;
