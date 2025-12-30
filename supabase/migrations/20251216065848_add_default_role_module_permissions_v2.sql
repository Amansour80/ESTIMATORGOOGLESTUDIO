/*
  # Default Role Module Permissions

  1. Purpose
    - Set up default permissions for common role patterns
    - Ensures new organizations have sensible permission defaults
    
  2. Default Permission Sets
    - Admin: Full access to all modules
    - Estimator: Full access to estimator modules, view access to others
    - Viewer: View-only access to most modules
    - Project Manager: Full access to PM and related modules

  3. Implementation
    - Create function to set default permissions for a role
    - This can be called when creating new roles
*/

-- Function to set default permissions for a role based on role name pattern
CREATE OR REPLACE FUNCTION public.set_default_module_permissions_for_role(
  p_role_id uuid,
  p_role_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module record;
  v_can_view boolean;
  v_can_edit boolean;
BEGIN
  -- Determine permissions based on role name patterns
  FOR v_module IN SELECT id, name FROM public.modules LOOP
    -- Default: no access
    v_can_view := false;
    v_can_edit := false;
    
    -- Admin gets full access to everything
    IF p_role_name ILIKE '%admin%' THEN
      v_can_view := true;
      v_can_edit := true;
    
    -- Estimator gets full access to estimator modules
    ELSIF p_role_name ILIKE '%estimator%' THEN
      IF v_module.name IN ('fm_estimator', 'retrofit_estimator', 'inquiries', 'asset_library', 'labor_library', 'dashboard', 'notifications', 'user_profile') THEN
        v_can_view := true;
        v_can_edit := true;
      ELSIF v_module.name IN ('retrofit_pm', 'approvals', 'settings') THEN
        v_can_view := true;
        v_can_edit := false;
      END IF;
    
    -- Project Manager gets full access to PM modules
    ELSIF p_role_name ILIKE '%project%manager%' OR p_role_name ILIKE '%pm%' THEN
      IF v_module.name IN ('retrofit_pm', 'dashboard', 'notifications', 'user_profile', 'approvals') THEN
        v_can_view := true;
        v_can_edit := true;
      ELSIF v_module.name IN ('fm_estimator', 'retrofit_estimator', 'inquiries', 'asset_library', 'labor_library') THEN
        v_can_view := true;
        v_can_edit := false;
      END IF;
    
    -- Viewer gets view-only access to most modules
    ELSIF p_role_name ILIKE '%viewer%' OR p_role_name ILIKE '%read%only%' THEN
      IF v_module.name NOT IN ('settings') THEN
        v_can_view := true;
        v_can_edit := false;
      END IF;
    
    -- Approver gets view access to projects, edit access to approvals
    ELSIF p_role_name ILIKE '%approver%' OR p_role_name ILIKE '%approval%' THEN
      IF v_module.name IN ('approvals', 'notifications', 'user_profile') THEN
        v_can_view := true;
        v_can_edit := true;
      ELSIF v_module.name IN ('fm_estimator', 'retrofit_estimator', 'retrofit_pm', 'dashboard', 'inquiries') THEN
        v_can_view := true;
        v_can_edit := false;
      END IF;
    
    -- Default role: basic access
    ELSE
      IF v_module.name IN ('dashboard', 'notifications', 'user_profile') THEN
        v_can_view := true;
        v_can_edit := true;
      END IF;
    END IF;
    
    -- Insert or update permission
    INSERT INTO public.role_module_permissions (role_id, module_id, can_view, can_edit)
    VALUES (p_role_id, v_module.id, v_can_view, v_can_edit)
    ON CONFLICT (role_id, module_id) 
    DO UPDATE SET
      can_view = EXCLUDED.can_view,
      can_edit = EXCLUDED.can_edit;
  END LOOP;
END;
$$;

-- Apply default permissions to existing roles
DO $$
DECLARE
  v_role record;
BEGIN
  FOR v_role IN SELECT id, role_name FROM public.organization_roles LOOP
    PERFORM public.set_default_module_permissions_for_role(v_role.id, v_role.role_name);
  END LOOP;
END $$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.set_default_module_permissions_for_role TO authenticated;