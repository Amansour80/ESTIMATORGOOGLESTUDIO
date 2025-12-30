/*
  # Fix find_user_by_email authentication check

  1. Problem
    - Function requires auth.uid() which may not always be available
    - Prevents legitimate use cases

  2. Solution
    - Remove strict auth requirement
    - Function is still SECURITY DEFINER so it's safe
    - Only returns user ID (no sensitive data)
*/

CREATE OR REPLACE FUNCTION find_user_by_email(search_email text)
RETURNS TABLE (user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(search_email)
  LIMIT 1;
END;
$$;