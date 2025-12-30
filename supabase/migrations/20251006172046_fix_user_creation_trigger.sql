/*
  # Fix user creation trigger conflict

  1. Problem
    - Two separate triggers were competing on auth.users INSERT
    - Organization creation trigger was being replaced by profile creation trigger
    - This caused "database error" for new signups
  
  2. Solution
    - Merge both triggers into a single comprehensive function
    - Create organization, membership, subscription, AND profile in one operation
    - Ensures data integrity and consistency
  
  3. What it does
    - Creates organization for new user
    - Adds user as organization owner
    - Creates free subscription
    - Creates user profile
    - All in one atomic operation
*/

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create comprehensive function to handle all new user setup
CREATE OR REPLACE FUNCTION handle_new_user_complete()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id uuid;
BEGIN
  -- Create organization
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Organization'))
  RETURNING id INTO new_org_id;
  
  -- Add user as owner
  INSERT INTO public.organization_members (organization_id, user_id, role, status, joined_at)
  VALUES (new_org_id, NEW.id, 'owner', 'active', now());
  
  -- Create free subscription
  INSERT INTO public.subscriptions (organization_id, plan, user_limit, amount, status)
  VALUES (new_org_id, 'free', 1, 0, 'active');
  
  -- Create user profile
  INSERT INTO public.user_profiles (id, complementary_account, created_by)
  VALUES (NEW.id, false, NULL)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create single trigger for all user setup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_complete();