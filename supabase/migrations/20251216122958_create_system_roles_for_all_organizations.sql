/*
  # Create System Roles for All Organizations

  1. Purpose
    - Migrate from old role system (organization_members.role) to new system (organization_roles + user_role_assignments)
    - Create default system roles (Owner, Admin, Estimator, Viewer) for each organization
    - Migrate existing user roles to the new system
    
  2. Changes
    - Create system roles for all existing organizations
    - Set appropriate module permissions for each system role
    - Migrate existing users to the new role system
    - Keep organization_members.role for backward compatibility but deprecate it
    
  3. System Roles
    - Owner: Full access to everything
    - Admin: Full access except subscription management
    - Estimator: Access to estimator tools and libraries
    - Viewer: View-only access to most modules
*/

-- Function to create system roles for an organization
CREATE OR REPLACE FUNCTION public.create_system_roles_for_organization(
  p_org_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_role_id uuid;
  v_admin_role_id uuid;
  v_estimator_role_id uuid;
  v_viewer_role_id uuid;
  v_module record;
BEGIN
  -- Check if system roles already exist for this organization
  IF EXISTS (
    SELECT 1 FROM public.organization_roles 
    WHERE organization_id = p_org_id 
    AND role_type = 'system'
  ) THEN
    RETURN;
  END IF;

  -- Create Owner role
  INSERT INTO public.organization_roles (organization_id, role_name, role_type, description, color, permissions)
  VALUES (
    p_org_id,
    'Owner',
    'system',
    'Full access to all features including subscription management',
    '#EF4444',
    jsonb_build_object(
      'can_view', true,
      'can_edit', true,
      'can_approve', true,
      'can_manage_workflows', true,
      'can_manage_roles', true,
      'can_view_budgets', true,
      'can_manage_budgets', true,
      'can_review_costs', true,
      'can_manage_cost_workflows', true
    )
  )
  RETURNING id INTO v_owner_role_id;

  -- Create Admin role
  INSERT INTO public.organization_roles (organization_id, role_name, role_type, description, color, permissions)
  VALUES (
    p_org_id,
    'Admin',
    'system',
    'Full access to all features except subscription management',
    '#3B82F6',
    jsonb_build_object(
      'can_view', true,
      'can_edit', true,
      'can_approve', true,
      'can_manage_workflows', true,
      'can_manage_roles', true,
      'can_view_budgets', true,
      'can_manage_budgets', true,
      'can_review_costs', true,
      'can_manage_cost_workflows', true
    )
  )
  RETURNING id INTO v_admin_role_id;

  -- Create Estimator role
  INSERT INTO public.organization_roles (organization_id, role_name, role_type, description, color, permissions)
  VALUES (
    p_org_id,
    'Estimator',
    'system',
    'Access to all estimator tools and project management',
    '#10B981',
    jsonb_build_object(
      'can_view', true,
      'can_edit', true,
      'can_approve', false,
      'can_manage_workflows', false,
      'can_manage_roles', false,
      'can_view_budgets', true,
      'can_manage_budgets', false,
      'can_review_costs', false,
      'can_manage_cost_workflows', false
    )
  )
  RETURNING id INTO v_estimator_role_id;

  -- Create Viewer role
  INSERT INTO public.organization_roles (organization_id, role_name, role_type, description, color, permissions)
  VALUES (
    p_org_id,
    'Viewer',
    'system',
    'View-only access to projects and reports',
    '#6B7280',
    jsonb_build_object(
      'can_view', true,
      'can_edit', false,
      'can_approve', false,
      'can_manage_workflows', false,
      'can_manage_roles', false,
      'can_view_budgets', true,
      'can_manage_budgets', false,
      'can_review_costs', false,
      'can_manage_cost_workflows', false
    )
  )
  RETURNING id INTO v_viewer_role_id;

  -- Set module permissions for Owner (full access to everything)
  FOR v_module IN SELECT id, name FROM public.modules LOOP
    INSERT INTO public.role_module_permissions (role_id, module_id, can_view, can_edit)
    VALUES (v_owner_role_id, v_module.id, true, true);
  END LOOP;

  -- Set module permissions for Admin (full access except settings might be limited)
  FOR v_module IN SELECT id, name FROM public.modules LOOP
    INSERT INTO public.role_module_permissions (role_id, module_id, can_view, can_edit)
    VALUES (v_admin_role_id, v_module.id, true, true);
  END LOOP;

  -- Set module permissions for Estimator
  FOR v_module IN SELECT id, name FROM public.modules LOOP
    IF v_module.name IN ('dashboard', 'inquiries', 'fm_estimator', 'retrofit_estimator', 'hk_estimator', 'retrofit_pm', 'asset_library', 'labor_library', 'notifications', 'user_profile') THEN
      INSERT INTO public.role_module_permissions (role_id, module_id, can_view, can_edit)
      VALUES (v_estimator_role_id, v_module.id, true, true);
    ELSIF v_module.name IN ('approvals') THEN
      INSERT INTO public.role_module_permissions (role_id, module_id, can_view, can_edit)
      VALUES (v_estimator_role_id, v_module.id, true, false);
    ELSE
      INSERT INTO public.role_module_permissions (role_id, module_id, can_view, can_edit)
      VALUES (v_estimator_role_id, v_module.id, false, false);
    END IF;
  END LOOP;

  -- Set module permissions for Viewer (view-only access to most things)
  FOR v_module IN SELECT id, name FROM public.modules LOOP
    IF v_module.name IN ('settings') THEN
      INSERT INTO public.role_module_permissions (role_id, module_id, can_view, can_edit)
      VALUES (v_viewer_role_id, v_module.id, false, false);
    ELSE
      INSERT INTO public.role_module_permissions (role_id, module_id, can_view, can_edit)
      VALUES (v_viewer_role_id, v_module.id, true, false);
    END IF;
  END LOOP;

END;
$$;

-- Create system roles for all existing organizations
DO $$
DECLARE
  v_org record;
BEGIN
  FOR v_org IN SELECT id FROM public.organizations LOOP
    PERFORM public.create_system_roles_for_organization(v_org.id);
  END LOOP;
END $$;

-- Migrate existing users from old role system to new system
DO $$
DECLARE
  v_member record;
  v_role_id uuid;
BEGIN
  FOR v_member IN 
    SELECT 
      om.id,
      om.user_id,
      om.organization_id,
      om.role
    FROM public.organization_members om
    WHERE om.status = 'active'
  LOOP
    -- Find the corresponding system role in the new system
    SELECT r.id INTO v_role_id
    FROM public.organization_roles r
    WHERE r.organization_id = v_member.organization_id
      AND r.role_type = 'system'
      AND (
        (v_member.role = 'owner' AND r.role_name = 'Owner') OR
        (v_member.role = 'admin' AND r.role_name = 'Admin') OR
        (v_member.role = 'estimator' AND r.role_name = 'Estimator') OR
        (v_member.role IN ('viewer', 'user') AND r.role_name = 'Viewer')
      );

    -- Only insert if not already exists
    IF v_role_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.user_role_assignments
      WHERE user_id = v_member.user_id
        AND organization_id = v_member.organization_id
        AND role_id = v_role_id
        AND is_active = true
    ) THEN
      INSERT INTO public.user_role_assignments (
        organization_id,
        user_id,
        role_id,
        is_active
      )
      VALUES (
        v_member.organization_id,
        v_member.user_id,
        v_role_id,
        true
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- Create trigger to automatically create system roles for new organizations
CREATE OR REPLACE FUNCTION public.create_system_roles_on_org_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_system_roles_for_organization(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_create_system_roles ON public.organizations;
CREATE TRIGGER trigger_create_system_roles
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.create_system_roles_on_org_creation();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_system_roles_for_organization TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_system_roles_on_org_creation TO authenticated;
