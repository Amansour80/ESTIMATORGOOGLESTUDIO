/*
  # Fix Infinite Recursion in user_role_assignments Policies

  ## Overview
  The current RLS policies cause infinite recursion because they query
  user_role_assignments to check if the user has can_manage_roles permission.
  This creates a loop: INSERT → check policy → query user_role_assignments → check policy → ...

  ## Solution
  Create a helper function that checks permissions without triggering RLS,
  then use that function in the policies.

  ## Changes
  1. Create user_has_role_permission() function with SECURITY DEFINER
  2. Drop existing policies that cause recursion
  3. Recreate policies using the helper function
*/

-- Create helper function to check if user has a specific permission
CREATE OR REPLACE FUNCTION user_has_role_permission(
  p_user_id uuid,
  p_org_id uuid,
  p_permission text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  has_permission boolean;
BEGIN
  -- Check if user is owner or admin (organization_members)
  IF EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = p_user_id
      AND organization_id = p_org_id
      AND role IN ('owner', 'admin')
  ) THEN
    RETURN true;
  END IF;

  -- Check if user has a role with the specified permission
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role_assignments ura
    JOIN public.organization_roles r ON ura.role_id = r.id
    WHERE ura.user_id = p_user_id
      AND ura.organization_id = p_org_id
      AND ura.is_active = true
      AND r.is_active = true
      AND (r.permissions ->> p_permission)::boolean = true
  ) INTO has_permission;

  RETURN COALESCE(has_permission, false);
END;
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins and role managers can create role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins and role managers can update role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins and role managers can delete role assignments" ON user_role_assignments;

-- Recreate INSERT policy without recursion
CREATE POLICY "Admins and role managers can create role assignments"
ON user_role_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only allow assigning roles to users in the same organization
  user_id IN (
    SELECT user_id FROM public.organization_members
    WHERE organization_id = user_role_assignments.organization_id
  )
  AND (
    -- User is owner/admin OR has can_manage_roles permission
    user_has_role_permission(auth.uid(), organization_id, 'can_manage_roles')
  )
);

-- Recreate UPDATE policy without recursion
CREATE POLICY "Admins and role managers can update role assignments"
ON user_role_assignments
FOR UPDATE
TO authenticated
USING (
  user_has_role_permission(auth.uid(), organization_id, 'can_manage_roles')
)
WITH CHECK (
  user_has_role_permission(auth.uid(), organization_id, 'can_manage_roles')
);

-- Recreate DELETE policy without recursion
CREATE POLICY "Admins and role managers can delete role assignments"
ON user_role_assignments
FOR DELETE
TO authenticated
USING (
  user_has_role_permission(auth.uid(), organization_id, 'can_manage_roles')
);
