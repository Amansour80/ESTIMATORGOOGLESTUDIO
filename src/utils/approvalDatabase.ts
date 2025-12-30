import { supabase } from '../lib/supabase';

export interface ProjectApproval {
  id: string;
  project_id: string;
  project_type: 'fm' | 'retrofit' | 'hk';
  workflow_id: string;
  workflow_name?: string;
  current_node_id: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'revision_requested';
  submitted_by: string;
  submitted_at: string;
  completed_at: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ApprovalAction {
  approval_id: string;
  user_id: string;
  action: 'submitted' | 'approved' | 'rejected' | 'revision_requested' | 'delegated' | 'commented';
  comments?: string;
  role_id?: string;
}

export async function getActiveWorkflow(orgId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('approval_workflows')
    .select('id')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

export async function submitProjectForApproval(
  projectId: string,
  projectType: 'fm' | 'retrofit' | 'hk',
  userId: string,
  orgId: string
): Promise<string> {
  const { data, error } = await supabase.rpc('start_approval_workflow', {
    p_project_id: projectId,
    p_project_type: projectType,
    p_submitted_by: userId,
    p_org_id: orgId,
  });

  if (error) throw error;
  return data;
}

export async function getProjectApproval(
  projectId: string,
  projectType: 'fm' | 'retrofit' | 'hk'
): Promise<ProjectApproval | null> {
  const { data, error } = await supabase
    .from('project_approvals')
    .select(`
      *,
      workflow:approval_workflows(name)
    `)
    .eq('project_id', projectId)
    .eq('project_type', projectType)
    .maybeSingle();

  if (error) throw error;

  if (data && data.workflow) {
    return {
      ...data,
      workflow_name: data.workflow.name,
    };
  }

  return data;
}

export async function getPendingApprovals(userId: string): Promise<ProjectApproval[]> {
  const { data, error } = await supabase
    .from('project_approvals')
    .select(`
      *,
      workflow:approval_workflows(name)
    `)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(item => ({
    ...item,
    workflow_name: item.workflow?.name,
  }));
}

export async function canUserApprove(approvalId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_user_approve_at_node', {
    p_approval_id: approvalId,
    p_user_id: userId,
  });

  if (error) throw error;
  return data || false;
}

export async function processApprovalAction(
  approvalId: string,
  userId: string,
  action: 'approved' | 'rejected' | 'revision_requested',
  comments?: string,
  roleId?: string
): Promise<void> {
  const { error } = await supabase.rpc('process_approval_action', {
    p_approval_id: approvalId,
    p_user_id: userId,
    p_action: action,
    p_comments: comments || null,
    p_role_id: roleId || null,
  });

  if (error) throw error;
}

export async function getApprovalHistory(approvalId: string) {
  const { data, error } = await supabase
    .from('project_approval_history')
    .select(`
      *,
      user:user_profiles(full_name, email)
    `)
    .eq('approval_id', approvalId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getMyPendingApprovals(userId: string, orgId: string): Promise<ProjectApproval[]> {
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_role_assignments')
    .select('role_id')
    .eq('user_id', userId)
    .eq('organization_id', orgId);

  if (rolesError) throw rolesError;

  const roleIds = (userRoles || []).map(r => r.role_id);

  if (roleIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_approvals')
    .select(`
      *,
      workflow:approval_workflows(name)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  const filtered: ProjectApproval[] = [];

  for (const approval of data || []) {
    const canApprove = await canUserApprove(approval.id, userId);
    if (canApprove) {
      filtered.push({
        ...approval,
        workflow_name: approval.workflow?.name,
      });
    }
  }

  return filtered;
}
