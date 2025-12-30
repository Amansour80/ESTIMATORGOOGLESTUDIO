/*
  # Create function to find user by email

  1. Function
    - `find_user_by_email` - Returns user ID if user exists
    - Takes an email address
    - Returns user ID from auth.users
    - Can be called by organization admins

  2. Security
    - Callable by any authenticated user
    - Returns only user ID, no sensitive data
    - Used for inviting users to organizations
*/

CREATE OR REPLACE FUNCTION find_user_by_email(search_email text)
RETURNS TABLE (user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Must be authenticated to call this
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT au.id
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(search_email)
  LIMIT 1;
END;
$$;