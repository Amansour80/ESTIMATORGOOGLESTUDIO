/*
  # Fix get_organization_members_with_emails Field Name
  
  1. Problem
    - Function returns `user_email` field
    - Frontend code expects `email` field
    - This causes the dropdown to be empty
  
  2. Solution
    - Drop and recreate function to return `email` instead of `user_email`
*/

DROP FUNCTION IF EXISTS get_organization_members_with_emails(uuid);

CREATE OR REPLACE FUNCTION get_organization_members_with_emails(org_id uuid)
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
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the caller is a member of the organization
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = org_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
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
    COALESCE(au.email, 'Unknown')::text as email
  FROM organization_members om
  LEFT JOIN auth.users au ON au.id = om.user_id
  WHERE om.organization_id = org_id
  AND om.status = 'active'
  ORDER BY om.created_at DESC;
END;
$$;
