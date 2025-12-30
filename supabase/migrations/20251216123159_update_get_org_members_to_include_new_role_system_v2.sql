/*
  # Update Organization Members Function to Include New Role System

  1. Purpose
    - Update get_organization_members_with_emails to return role information from the new system
    - Include both role ID and role name for UI display
    
  2. Changes
    - Drop and recreate function with new return type
    - Add role_id and role_name from user_role_assignments + organization_roles
    - Keep backward compatibility by also returning the old role field
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_organization_members_with_emails(uuid);

-- Recreate with new return type
CREATE OR REPLACE FUNCTION public.get_organization_members_with_emails(org_id uuid)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  user_id uuid,
  role text,
  role_id uuid,
  role_name text,
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
  SELECT 
    om.id,
    om.organization_id,
    om.user_id,
    om.role::text,
    ura.role_id,
    r.role_name,
    om.invited_by,
    om.invited_at,
    om.joined_at,
    om.status::text,
    om.created_at,
    u.email
  FROM public.organization_members om
  INNER JOIN auth.users u ON u.id = om.user_id
  LEFT JOIN public.user_role_assignments ura ON ura.user_id = om.user_id 
    AND ura.organization_id = om.organization_id 
    AND ura.is_active = true
  LEFT JOIN public.organization_roles r ON r.id = ura.role_id
  WHERE om.organization_id = org_id
  ORDER BY om.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_organization_members_with_emails TO authenticated;
