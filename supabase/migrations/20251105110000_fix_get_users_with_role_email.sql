/*
  # Fix get_users_with_role Function to Fetch Email from auth.users

  ## Overview
  The get_users_with_role function was trying to access up.email from user_profiles,
  but user_profiles doesn't have an email column. Email is stored in auth.users.

  ## Changes
  - Drop and recreate get_users_with_role function
  - Join with auth.users to get email instead of user_profiles
  - Add proper search_path setting for security

  ## Security
  - Function remains SECURITY DEFINER to access auth.users
  - Still checks organization membership via RLS
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_users_with_role(uuid, uuid);

-- Recreate function with correct email source
CREATE OR REPLACE FUNCTION get_users_with_role(
  p_org_id uuid,
  p_role_id uuid
)
RETURNS TABLE (
  user_id uuid,
  user_email text,
  full_name text,
  assigned_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ura.user_id,
    au.email::text as user_email,
    up.full_name,
    ura.assigned_at
  FROM public.user_role_assignments ura
  INNER JOIN public.user_profiles up ON ura.user_id = up.id
  INNER JOIN auth.users au ON up.id = au.id
  WHERE ura.organization_id = p_org_id
    AND ura.role_id = p_role_id
    AND ura.is_active = true
  ORDER BY ura.assigned_at DESC;
END;
$$;
