/*
  # Fix get_users_with_role Function
  
  ## Overview
  Drop and recreate the function with correct return type.
  
  ## Changes
  - Drop existing function
  - Create with correct signature
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_users_with_role(uuid, uuid);

-- Create function to get users with a specific role
CREATE OR REPLACE FUNCTION get_users_with_role(
  p_org_id uuid,
  p_role_id uuid
)
RETURNS TABLE (
  user_id uuid,
  user_email text,
  full_name text,
  assigned_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ura.user_id,
    up.email,
    up.full_name,
    ura.assigned_at
  FROM user_role_assignments ura
  INNER JOIN user_profiles up ON ura.user_id = up.id
  WHERE ura.organization_id = p_org_id
    AND ura.role_id = p_role_id
    AND ura.is_active = true
  ORDER BY ura.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;