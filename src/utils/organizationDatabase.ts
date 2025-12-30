import { supabase } from '../lib/supabase';

export interface Organization {
  id: string;
  name: string;
  logo_url: string | null;
  currency: string;
  vat_rate: number;
  date_format: string;
  number_format: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'user' | 'viewer';
  invited_by: string | null;
  invited_at: string;
  joined_at: string | null;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
}

export interface Subscription {
  id: string;
  organization_id: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  user_limit: number;
  billing_cycle: 'monthly' | 'annual';
  amount: number;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberWithUser extends OrganizationMember {
  user_email?: string;
  role_id?: string;
  role_name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Get the current user's primary organization
 */
export async function getCurrentUserOrganization(): Promise<{ success: boolean; data?: Organization; error?: string }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('[ORG DEBUG] User error:', userError);
      return { success: false, error: userError.message };
    }

    if (!user) {
      console.error('[ORG DEBUG] No user found');
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's organization membership (prioritize owner role, but accept any)
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('role', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (memberError) {
      console.error('[ORG DEBUG] Membership error:', memberError);
      return { success: false, error: memberError.message };
    }

    if (!membership) {
      console.error('[ORG DEBUG] No membership found');
      return { success: false, error: 'No organization found for user. Please contact support.' };
    }

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', membership.organization_id)
      .maybeSingle();

    if (orgError) {
      console.error('[ORG DEBUG] Organization error:', orgError);
      return { success: false, error: orgError.message };
    }

    if (!org) {
      console.error('[ORG DEBUG] No org found with ID:', membership.organization_id);
      return { success: false, error: 'Organization not found' };
    }

    return { success: true, data: org };
  } catch (error: any) {
    console.error('[ORG DEBUG] Unexpected error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update organization settings
 */
export async function updateOrganization(
  organizationId: string,
  updates: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', organizationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get organization subscription
 */
export async function getOrganizationSubscription(
  organizationId: string
): Promise<{ success: boolean; data?: Subscription; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get organization members
 */
export async function getOrganizationMembers(
  organizationId: string
): Promise<{ success: boolean; data?: MemberWithUser[]; error?: string }> {
  try {
    const { data: members, error: memberError } = await supabase
      .rpc('get_organization_members_with_emails', { org_id: organizationId });

    if (memberError) {
      return { success: false, error: memberError.message };
    }

    return { success: true, data: members || [] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if user is admin or owner of an organization
 */
async function isOrgAdmin(userId: string, organizationId: string): Promise<boolean> {
  const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { check_user_id: userId });
  if (isSuperAdmin) return true;

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .maybeSingle();

  return membership?.role === 'owner' || membership?.role === 'admin';
}

/**
 * Get available roles for an organization (system + custom)
 */
export async function getOrganizationRolesForDropdown(
  organizationId: string
): Promise<{ id: string; name: string; type: 'system' | 'custom' }[]> {
  const { data, error } = await supabase
    .from('organization_roles')
    .select('id, role_name, role_type')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('role_type', { ascending: false })
    .order('role_name');

  if (error) {
    console.error('Error fetching roles:', error);
    return [];
  }

  return (data || []).map(role => ({
    id: role.id,
    name: role.role_name,
    type: role.role_type as 'system' | 'custom'
  }));
}

/**
 * Invite user to organization (New unified system)
 */
export async function inviteUserToOrganization(
  organizationId: string,
  email: string,
  roleIdOrLegacyRole: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const isAdmin = await isOrgAdmin(currentUser.id, organizationId);
    if (!isAdmin) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Check if user exists using RPC function
    const { data: userResults, error: userError } = await supabase
      .rpc('find_user_by_email', { search_email: email });

    if (userError) {
      return { success: false, error: userError.message };
    }

    if (!userResults || userResults.length === 0) {
      return { success: false, error: 'User not found. They must sign up first.' };
    }

    const existingUser = { id: userResults[0].user_id };

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', existingUser.id)
      .maybeSingle();

    if (existingMember) {
      return { success: false, error: 'User is already a member' };
    }

    // Determine if roleIdOrLegacyRole is a UUID (new system) or legacy role name
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roleIdOrLegacyRole);

    let roleId = roleIdOrLegacyRole;
    let legacyRoleName = 'viewer';

    if (isUUID) {
      // New system: get the role details
      const { data: roleData } = await supabase
        .from('organization_roles')
        .select('role_name')
        .eq('id', roleIdOrLegacyRole)
        .maybeSingle();

      if (roleData) {
        // Map role name to legacy role for backward compatibility
        const roleName = roleData.role_name.toLowerCase();
        if (roleName === 'owner' || roleName === 'admin') legacyRoleName = 'admin';
        else if (roleName === 'estimator') legacyRoleName = 'estimator';
        else legacyRoleName = 'viewer';
      }
    } else {
      // Old system: find the corresponding system role
      legacyRoleName = roleIdOrLegacyRole as any;
      const roleNameMap: Record<string, string> = {
        'admin': 'Admin',
        'estimator': 'Estimator',
        'viewer': 'Viewer'
      };

      const { data: roleData } = await supabase
        .from('organization_roles')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('role_name', roleNameMap[roleIdOrLegacyRole] || 'Viewer')
        .eq('role_type', 'system')
        .maybeSingle();

      if (roleData) {
        roleId = roleData.id;
      }
    }

    // Add member to organization_members (for backward compatibility)
    const { error: insertError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: existingUser.id,
        role: legacyRoleName,
        invited_by: currentUser.id,
        status: 'active',
        joined_at: new Date().toISOString()
      });

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Add role assignment (new system)
    const { error: roleError } = await supabase
      .from('user_role_assignments')
      .insert({
        organization_id: organizationId,
        user_id: existingUser.id,
        role_id: roleId,
        assigned_by: currentUser.id,
        is_active: true
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      // Don't fail the entire operation if role assignment fails
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Update member role (New unified system)
 */
export async function updateMemberRole(
  memberId: string,
  roleIdOrLegacyRole: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, user_id')
      .eq('id', memberId)
      .maybeSingle();

    if (!member) {
      return { success: false, error: 'Member not found' };
    }

    const isAdmin = await isOrgAdmin(currentUser.id, member.organization_id);
    if (!isAdmin) {
      return { success: false, error: 'Insufficient permissions' };
    }

    // Determine if roleIdOrLegacyRole is a UUID (new system) or legacy role name
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roleIdOrLegacyRole);

    let roleId = roleIdOrLegacyRole;
    let legacyRoleName = 'viewer';

    if (isUUID) {
      // New system: get the role details
      const { data: roleData } = await supabase
        .from('organization_roles')
        .select('role_name')
        .eq('id', roleIdOrLegacyRole)
        .maybeSingle();

      if (roleData) {
        // Map role name to legacy role for backward compatibility
        const roleName = roleData.role_name.toLowerCase();
        if (roleName === 'owner' || roleName === 'admin') legacyRoleName = 'admin';
        else if (roleName === 'estimator') legacyRoleName = 'estimator';
        else legacyRoleName = 'viewer';
      }
    } else {
      // Old system: find the corresponding system role
      legacyRoleName = roleIdOrLegacyRole as any;
      const roleNameMap: Record<string, string> = {
        'admin': 'Admin',
        'estimator': 'Estimator',
        'viewer': 'Viewer'
      };

      const { data: roleData } = await supabase
        .from('organization_roles')
        .select('id')
        .eq('organization_id', member.organization_id)
        .eq('role_name', roleNameMap[roleIdOrLegacyRole] || 'Viewer')
        .eq('role_type', 'system')
        .maybeSingle();

      if (roleData) {
        roleId = roleData.id;
      }
    }

    // Update organization_members (for backward compatibility)
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ role: legacyRoleName })
      .eq('id', memberId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Deactivate old role assignments
    await supabase
      .from('user_role_assignments')
      .update({ is_active: false })
      .eq('user_id', member.user_id)
      .eq('organization_id', member.organization_id);

    // Create new role assignment
    const { error: roleError } = await supabase
      .from('user_role_assignments')
      .insert({
        organization_id: member.organization_id,
        user_id: member.user_id,
        role_id: roleId,
        assigned_by: currentUser.id,
        is_active: true
      });

    if (roleError) {
      console.error('Error assigning role:', roleError);
      // Don't fail the entire operation if role assignment fails
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Remove member from organization
 */
export async function removeMemberFromOrganization(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('id', memberId)
      .maybeSingle();

    if (!member) {
      return { success: false, error: 'Member not found' };
    }

    const isAdmin = await isOrgAdmin(currentUser.id, member.organization_id);
    if (!isAdmin) {
      return { success: false, error: 'Insufficient permissions' };
    }

    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Check if user can perform action based on role
 */
export async function checkUserPermission(
  organizationId: string,
  requiredRole: 'owner' | 'admin' | 'user' | 'viewer'
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return false;

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!member) return false;

    const roleHierarchy: Record<string, number> = { viewer: 0, estimator: 1, admin: 2, owner: 3 };
    return (roleHierarchy[member.role] || 0) >= (roleHierarchy[requiredRole] || 0);
  } catch {
    return false;
  }
}

/**
 * Get active member count for organization
 */
export async function getActiveMemberCount(
  organizationId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { count, error } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
