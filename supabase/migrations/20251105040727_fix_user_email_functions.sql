/*
  # Fix User Email Functions

  1. Problem
    - Functions have empty search_path but use unqualified table names
    - This causes them to fail to find tables
    - Results in "Unknown" showing for user names and empty member lists
  
  2. Solution
    - Update get_user_emails to use fully qualified table names (auth.users, public.super_admins)
    - Update get_organization_members_with_emails to use fully qualified table names (public.organization_members, auth.users)
  
  3. Changes
    - Recreate both functions with proper schema qualification
    - Maintain SECURITY DEFINER for access to auth.users
    - Keep all existing security checks
*/

-- Fix get_user_emails function
CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids uuid[])
RETURNS TABLE (id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if caller is super admin
  IF NOT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only super admins can call this function';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email::text
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Fix get_organization_members_with_emails function
CREATE OR REPLACE FUNCTION public.get_organization_members_with_emails(org_id uuid)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  user_id uuid,
  role text,
  invited_by uuid,
  invited_at timestamptz,
  joined_at timestamptz,
  status text,
  created_at timestamptz,
  user_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Check if the caller is a member of the organization
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE public.organization_members.organization_id = org_id
    AND public.organization_members.user_id = auth.uid()
    AND public.organization_members.status = 'active'
  ) THEN
    RAISE EXCEPTION 'Not authorized to view members of this organization';
  END IF;

  RETURN QUERY
  SELECT 
    om.id,
    om.organization_id,
    om.user_id,
    om.role,
    om.invited_by,
    om.invited_at,
    om.joined_at,
    om.status,
    om.created_at,
    COALESCE(au.email, 'Unknown')::text as user_email
  FROM public.organization_members om
  LEFT JOIN auth.users au ON au.id = om.user_id
  WHERE om.organization_id = org_id
  ORDER BY om.created_at DESC;
END;
$$;
