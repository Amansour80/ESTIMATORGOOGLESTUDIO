/*
  # Create function to get organization members with emails

  1. Function
    - `get_organization_members_with_emails` - Returns organization members with their emails
    - Takes organization ID
    - Returns member data joined with user emails from auth.users
    - Can be called by organization members

  2. Security
    - Only returns data for the user's own organization
    - User must be a member of the organization
*/

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
  user_email text
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    COALESCE(au.email, 'Unknown')::text as user_email
  FROM organization_members om
  LEFT JOIN auth.users au ON au.id = om.user_id
  WHERE om.organization_id = org_id
  ORDER BY om.created_at DESC;
END;
$$;