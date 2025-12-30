import { supabase } from '../lib/supabase';

export interface OrganizationRole {
  id: string;
  organization_id: string;
  role_name: string;
  role_type: 'system' | 'custom';
  description: string | null;
  color: string;
  permissions: {
    can_view: boolean;
    can_edit: boolean;
    can_approve: boolean;
    can_manage_workflows: boolean;
    can_manage_roles: boolean;
    can_view_budgets: boolean;
    can_manage_budgets: boolean;
    can_review_costs: boolean;
    can_manage_cost_workflows: boolean;
  };
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRoleAssignment {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  assigned_at: string;
  is_active: boolean;
  role?: OrganizationRole;
  user?: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export async function getOrganizationRoles(orgId: string): Promise<OrganizationRole[]> {
  const { data, error } = await supabase
    .from('organization_roles')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('role_type', { ascending: false })
    .order('role_name');

  if (error) throw error;
  return data || [];
}

export async function createCustomRole(
  orgId: string,
  roleName: string,
  description: string,
  color: string,
  permissions: OrganizationRole['permissions']
): Promise<OrganizationRole> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('organization_roles')
    .insert({
      organization_id: orgId,
      role_name: roleName,
      role_type: 'custom',
      description,
      color,
      permissions,
      created_by: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCustomRole(
  roleId: string,
  updates: {
    role_name?: string;
    description?: string;
    color?: string;
    permissions?: OrganizationRole['permissions'];
    is_active?: boolean;
  }
): Promise<OrganizationRole> {
  const { data, error } = await supabase
    .from('organization_roles')
    .update(updates)
    .eq('id', roleId)
    .eq('role_type', 'custom')
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCustomRole(roleId: string): Promise<void> {
  const { error } = await supabase
    .from('organization_roles')
    .delete()
    .eq('id', roleId)
    .eq('role_type', 'custom');

  if (error) throw error;
}

export async function getUserRoleAssignments(
  orgId: string
): Promise<UserRoleAssignment[]> {
  const { data, error } = await supabase
    .from('user_role_assignments')
    .select(`
      *,
      role:organization_roles(*),
      user:user_profiles!user_id(id, first_name, last_name)
    `)
    .eq('organization_id', orgId)
    .eq('is_active', true);

  if (error) throw error;
  if (!data || data.length === 0) return [];

  const { data: orgMembers } = await supabase.rpc('get_organization_members_with_emails', {
    org_id: orgId,
  });

  const emailMap = new Map(
    orgMembers?.map((m: any) => [m.user_id, m.email]) || []
  );

  return data.map((assignment) => ({
    ...assignment,
    user: {
      id: assignment.user_id,
      email: emailMap.get(assignment.user_id) || '',
      first_name: assignment.user?.first_name || null,
      last_name: assignment.user?.last_name || null,
    },
  }));
}

export async function assignRoleToUser(
  orgId: string,
  userId: string,
  roleId: string
): Promise<UserRoleAssignment> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('user_role_assignments')
    .insert({
      organization_id: orgId,
      user_id: userId,
      role_id: roleId,
      assigned_by: userData.user?.id,
    })
    .select(`
      *,
      role:organization_roles(*),
      user:user_profiles!user_id(id, full_name)
    `)
    .single();

  if (error) throw error;

  const { data: orgMembers } = await supabase.rpc('get_organization_members_with_emails', {
    org_id: orgId,
  });

  const member = orgMembers?.find((m: any) => m.user_id === userId);

  return {
    ...data,
    user: data.user ? {
      ...data.user,
      email: member?.email || '',
    } : undefined,
  };
}

export async function removeRoleFromUser(assignmentId: string): Promise<void> {
  const { error } = await supabase
    .from('user_role_assignments')
    .update({ is_active: false })
    .eq('id', assignmentId);

  if (error) throw error;
}

export async function getUserRoles(userId: string, orgId: string): Promise<OrganizationRole[]> {
  const { data, error } = await supabase.rpc('get_user_approval_roles', {
    p_user_id: userId,
    p_org_id: orgId,
  });

  if (error) throw error;
  return data || [];
}

export async function getUsersWithRole(orgId: string, roleId: string) {
  const { data, error } = await supabase.rpc('get_users_with_role', {
    p_org_id: orgId,
    p_role_id: roleId,
  });

  if (error) throw error;
  return data || [];
}

export const DEFAULT_ROLE_COLORS = {
  admin: '#EF4444',
  estimator: '#3B82F6',
  viewer: '#6B7280',
  cost_controller: '#F59E0B',
  cfo: '#8B5CF6',
  project_manager: '#10B981',
  technical_lead: '#06B6D4',
};

export const DEFAULT_PERMISSIONS = {
  can_view: true,
  can_edit: false,
  can_approve: false,
  can_manage_workflows: false,
  can_manage_roles: false,
};
