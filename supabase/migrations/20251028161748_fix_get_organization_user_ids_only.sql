/*
  # Fix get_organization_user_ids Function

  1. Problem
    - Function has search_path set to empty string
    - But function is not using schema-qualified table names
    - This breaks all project queries

  2. Solution
    - Replace function body with schema-qualified table names

  3. Function Fixed
    - get_organization_user_ids
*/

-- Replace get_organization_user_ids with schema-qualified names
CREATE OR REPLACE FUNCTION get_organization_user_ids(input_user_id uuid)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
SELECT om2.user_id
FROM public.organization_members om1
JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
WHERE om1.user_id = input_user_id
AND om1.organization_id IS NOT NULL
AND om2.organization_id IS NOT NULL;
$$;

-- Now set the search path (after it's using qualified names)
ALTER FUNCTION get_organization_user_ids(input_user_id uuid) SET search_path = '';
