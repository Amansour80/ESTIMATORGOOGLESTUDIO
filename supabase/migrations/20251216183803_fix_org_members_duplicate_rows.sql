/*
  # Fix Duplicate Rows in Organization Members Function

  1. Purpose
    - Return only one row per member (using most recently assigned role)
    - Prevent duplicate entries when users have multiple active roles
    
  2. Changes
    - Use DISTINCT ON to get only one row per member
    - Order by most recent role assignment
*/

DROP FUNCTION IF EXISTS public.get_organization_members_with_emails(uuid);

CREATE OR REPLACE FUNCTION public.get_organization_members_with_emails(org_id uuid)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  user_id uuid,
  role text,
  role_id uuid,
  role_name text,
  first_name text,
  last_name text,
  invited_by uuid,
  invited_at timestamptz,
  joined_at timestamptz,
  status text,
  created_at timestamptz,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (om.user_id)
    om.id,
    om.organization_id,
    om.user_id,
    om.role::text,
    ura.role_id,
    r.role_name,
    up.first_name,
    up.last_name,
    om.invited_by,
    om.invited_at,
    om.joined_at,
    om.status::text,
    om.created_at,
    u.email::text
  FROM public.organization_members om
  INNER JOIN auth.users u ON u.id = om.user_id
  LEFT JOIN public.user_profiles up ON up.id = om.user_id
  LEFT JOIN public.user_role_assignments ura ON ura.user_id = om.user_id 
    AND ura.organization_id = om.organization_id 
    AND ura.is_active = true
  LEFT JOIN public.organization_roles r ON r.id = ura.role_id
  WHERE om.organization_id = org_id
  ORDER BY om.user_id, ura.assigned_at DESC NULLS LAST, om.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_organization_members_with_emails TO authenticated;
