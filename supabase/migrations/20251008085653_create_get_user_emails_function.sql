/*
  # Create function to get user emails

  1. Function
    - `get_user_emails` - Returns user emails for super admins
    - Takes an array of user IDs
    - Returns email addresses from auth.users

  2. Security
    - Only callable by super admins
*/

CREATE OR REPLACE FUNCTION get_user_emails(user_ids uuid[])
RETURNS TABLE (id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is super admin
  IF NOT EXISTS (
    SELECT 1 FROM super_admins WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only super admins can call this function';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email::text
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;
