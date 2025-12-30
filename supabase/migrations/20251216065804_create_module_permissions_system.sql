/*
  # Module Permissions System

  1. New Tables
    - `modules`
      - `id` (uuid, primary key)
      - `name` (text, unique) - Module identifier (e.g., 'fm_estimator', 'retrofit_estimator')
      - `display_name` (text) - Human-readable name
      - `description` (text) - Module description
      - `created_at` (timestamptz)
    
    - `role_module_permissions`
      - `id` (uuid, primary key)
      - `role_id` (uuid, foreign key to organization_roles)
      - `module_id` (uuid, foreign key to modules)
      - `can_view` (boolean) - Can view module content
      - `can_edit` (boolean) - Can edit module content
      - `created_at` (timestamptz)
      - Unique constraint on (role_id, module_id)

  2. Functions
    - `has_module_permission(user_id, module_name, permission_type)` - Check if user has permission
    - `get_user_module_permissions(user_id, org_id)` - Get all module permissions for a user

  3. Security
    - Enable RLS on all tables
    - Users can read their own permissions
    - Only admins and super admins can modify permissions
    
  4. Default Modules
    - Insert standard modules (FM, Retrofit, PM, Dashboard, etc.)
*/

-- Create modules table
CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Create role_module_permissions table
CREATE TABLE IF NOT EXISTS public.role_module_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.organization_roles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  can_view boolean DEFAULT false,
  can_edit boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, module_id)
);

ALTER TABLE public.role_module_permissions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_module_permissions_role_id ON public.role_module_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_module_permissions_module_id ON public.role_module_permissions(module_id);
CREATE INDEX IF NOT EXISTS idx_modules_name ON public.modules(name);

-- Insert default modules
INSERT INTO public.modules (name, display_name, description) VALUES
  ('dashboard', 'Dashboard', 'Main dashboard with metrics and overview'),
  ('fm_estimator', 'FM Estimator', 'Facilities Management cost estimation'),
  ('retrofit_estimator', 'Retrofit Estimator', 'Retrofit project estimation'),
  ('retrofit_pm', 'Retrofit PM', 'Retrofit project management and tracking'),
  ('inquiries', 'Inquiries', 'Client inquiry management'),
  ('approvals', 'Approvals', 'Project approval workflows'),
  ('asset_library', 'Asset Library', 'Organization asset library management'),
  ('labor_library', 'Labor Library', 'Organization labor library management'),
  ('settings', 'Settings', 'Organization settings and configuration'),
  ('notifications', 'Notifications', 'System notifications'),
  ('user_profile', 'User Profile', 'User profile and preferences')
ON CONFLICT (name) DO NOTHING;

-- Function to check if user has module permission
CREATE OR REPLACE FUNCTION public.has_module_permission(
  p_user_id uuid,
  p_module_name text,
  p_permission_type text -- 'view' or 'edit'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_permission boolean;
  v_is_super_admin boolean;
BEGIN
  -- Check if user is super admin (has access to everything)
  SELECT EXISTS(
    SELECT 1 FROM public.super_admins WHERE user_id = p_user_id
  ) INTO v_is_super_admin;
  
  IF v_is_super_admin THEN
    RETURN true;
  END IF;

  -- Check module permission through role assignments
  IF p_permission_type = 'view' THEN
    SELECT EXISTS(
      SELECT 1
      FROM public.user_role_assignments ura
      JOIN public.role_module_permissions rmp ON rmp.role_id = ura.role_id
      JOIN public.modules m ON m.id = rmp.module_id
      WHERE ura.user_id = p_user_id
        AND m.name = p_module_name
        AND (rmp.can_view = true OR rmp.can_edit = true)
    ) INTO v_has_permission;
  ELSIF p_permission_type = 'edit' THEN
    SELECT EXISTS(
      SELECT 1
      FROM public.user_role_assignments ura
      JOIN public.role_module_permissions rmp ON rmp.role_id = ura.role_id
      JOIN public.modules m ON m.id = rmp.module_id
      WHERE ura.user_id = p_user_id
        AND m.name = p_module_name
        AND rmp.can_edit = true
    ) INTO v_has_permission;
  ELSE
    RETURN false;
  END IF;

  RETURN COALESCE(v_has_permission, false);
END;
$$;

-- Function to get all module permissions for a user
CREATE OR REPLACE FUNCTION public.get_user_module_permissions(
  p_user_id uuid,
  p_org_id uuid
)
RETURNS TABLE(
  module_name text,
  display_name text,
  can_view boolean,
  can_edit boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_super_admin boolean;
BEGIN
  -- Check if user is super admin
  SELECT EXISTS(
    SELECT 1 FROM public.super_admins WHERE user_id = p_user_id
  ) INTO v_is_super_admin;
  
  -- Super admins have full access to everything
  IF v_is_super_admin THEN
    RETURN QUERY
    SELECT 
      m.name,
      m.display_name,
      true as can_view,
      true as can_edit
    FROM public.modules m;
  ELSE
    -- Get permissions from role assignments
    RETURN QUERY
    SELECT 
      m.name,
      m.display_name,
      bool_or(rmp.can_view OR rmp.can_edit) as can_view,
      bool_or(rmp.can_edit) as can_edit
    FROM public.user_role_assignments ura
    JOIN public.organization_roles r ON r.id = ura.role_id
    JOIN public.role_module_permissions rmp ON rmp.role_id = ura.role_id
    JOIN public.modules m ON m.id = rmp.module_id
    WHERE ura.user_id = p_user_id
      AND r.organization_id = p_org_id
    GROUP BY m.name, m.display_name;
  END IF;
END;
$$;

-- RLS Policies for modules table
CREATE POLICY "Users can view modules"
  ON public.modules FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for role_module_permissions table
CREATE POLICY "Users can view permissions for their organization"
  ON public.role_module_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_roles r
      JOIN public.organization_members om ON om.organization_id = r.organization_id
      WHERE r.id = role_module_permissions.role_id
        AND om.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert role module permissions"
  ON public.role_module_permissions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_roles r
      JOIN public.organization_members om ON om.organization_id = r.organization_id
      WHERE r.id = role_module_permissions.role_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update role module permissions"
  ON public.role_module_permissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_roles r
      JOIN public.organization_members om ON om.organization_id = r.organization_id
      WHERE r.id = role_module_permissions.role_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete role module permissions"
  ON public.role_module_permissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_roles r
      JOIN public.organization_members om ON om.organization_id = r.organization_id
      WHERE r.id = role_module_permissions.role_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
    )
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_module_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_module_permissions TO authenticated;