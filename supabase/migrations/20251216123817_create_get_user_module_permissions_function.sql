/*
  # Create get_user_module_permissions Function

  1. Purpose
    - Get all module permissions for a user based on their active role assignments
    - Used by the frontend to determine what modules a user can access
    
  2. Changes
    - Create function to return module permissions for a user
    - Returns module name, display name, can_view, can_edit
*/

CREATE OR REPLACE FUNCTION public.get_user_module_permissions(
  p_user_id uuid,
  p_org_id uuid
)
RETURNS TABLE (
  module_name text,
  display_name text,
  can_view boolean,
  can_edit boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (m.name)
    m.name as module_name,
    m.display_name,
    BOOL_OR(rmp.can_view) as can_view,
    BOOL_OR(rmp.can_edit) as can_edit
  FROM public.user_role_assignments ura
  JOIN public.organization_roles r ON r.id = ura.role_id
  JOIN public.role_module_permissions rmp ON rmp.role_id = r.id
  JOIN public.modules m ON m.id = rmp.module_id
  WHERE ura.user_id = p_user_id
    AND ura.organization_id = p_org_id
    AND ura.is_active = true
  GROUP BY m.name, m.display_name
  ORDER BY m.name;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_module_permissions TO authenticated;
