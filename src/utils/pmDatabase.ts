import { supabase } from '../lib/supabase';
import type {
  ProjectMember,
  ProjectActivity,
  ActivityDependency,
  ProjectDocument,
  DocumentVersion,
  DocumentWorkflowStep,
  DocumentComment,
  ProjectIssue,
  IssueComment,
  RetrofitProjectPM,
} from '../types/pm';

export async function getRetrofitPMProjects(organizationId: string): Promise<RetrofitProjectPM[]> {
  // Get current user once
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get user's project memberships
  const { data: userMemberships } = await supabase
    .from('project_members')
    .select('retrofit_project_id')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id);

  if (!userMemberships || userMemberships.length === 0) {
    return [];
  }

  const projectIds = userMemberships
    .map(m => m.retrofit_project_id)
    .filter(id => id != null);

  if (projectIds.length === 0) {
    return [];
  }

  // Fetch all projects in one query
  const { data, error } = await supabase
    .from('retrofit_projects')
    .select('id, project_name, client_name, pm_status, forecast_end_date, overall_progress, calculated_value, status, created_at, updated_at')
    .eq('organization_id', organizationId)
    .in('id', projectIds)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProjectMembers(retrofitProjectId: string): Promise<ProjectMember[]> {
  const { data, error } = await supabase
    .from('project_members')
    .select('*')
    .eq('retrofit_project_id', retrofitProjectId)
    .order('created_at');

  if (error) throw error;
  return data || [];
}

export async function addProjectMember(
  organizationId: string,
  retrofitProjectId: string,
  userId: string,
  role: string
): Promise<ProjectMember> {
  const { data, error } = await supabase
    .from('project_members')
    .insert({
      organization_id: organizationId,
      retrofit_project_id: retrofitProjectId,
      user_id: userId,
      role,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getActivities(retrofitProjectId: string): Promise<ProjectActivity[]> {
  const { data, error } = await supabase
    .from('project_activities')
    .select('*')
    .eq('retrofit_project_id', retrofitProjectId)
    .order('start_date');

  if (error) throw error;
  return data || [];
}

export async function getActivityDependencies(retrofitProjectId: string): Promise<ActivityDependency[]> {
  const { data, error } = await supabase
    .from('activity_dependencies')
    .select('*')
    .eq('retrofit_project_id', retrofitProjectId);

  if (error) throw error;
  return data || [];
}

export async function callActivityEdge(action: string, activityId: string | null, activityData: any) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-activity`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, activityId, activityData }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to manage activity');
  }

  return response.json();
}

export async function getDocuments(retrofitProjectId: string): Promise<ProjectDocument[]> {
  const { data, error } = await supabase
    .from('project_documents')
    .select('*')
    .eq('retrofit_project_id', retrofitProjectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getWorkflowSteps(documentId: string): Promise<DocumentWorkflowStep[]> {
  const { data, error } = await supabase
    .from('document_workflow_steps')
    .select('*')
    .eq('document_id', documentId)
    .order('step_order');

  if (error) throw error;
  return data || [];
}

export async function getDocumentComments(documentId: string): Promise<DocumentComment[]> {
  const { data, error } = await supabase
    .from('document_comments')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at');

  if (error) throw error;
  return data || [];
}

export async function callDocumentWorkflowEdge(
  action: string,
  documentId: string,
  stepId?: string,
  decision?: string,
  notes?: string,
  fileUrl?: string
) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-document-workflow`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, documentId, stepId, decision, notes, fileUrl }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to manage document workflow');
  }

  return response.json();
}

export async function getIssues(retrofitProjectId: string): Promise<ProjectIssue[]> {
  const { data, error } = await supabase
    .from('project_issues')
    .select('*')
    .eq('retrofit_project_id', retrofitProjectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getIssueComments(issueId: string): Promise<IssueComment[]> {
  const { data, error } = await supabase
    .from('issue_comments')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at');

  if (error) throw error;
  return data || [];
}

export async function callIssueEdge(action: string, issueId: string | null, issueData: any) {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-issue`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, issueId, issueData }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to manage issue');
  }

  return response.json();
}

export async function hasPermission(
  userId: string,
  retrofitProjectId: string,
  module: string,
  action: string
): Promise<boolean> {
  const { data: member } = await supabase
    .from('project_members')
    .select('role, organization_id')
    .eq('retrofit_project_id', retrofitProjectId)
    .eq('user_id', userId)
    .single();

  if (!member) return false;

  const { data: permission } = await supabase
    .from('project_permissions')
    .select('allowed')
    .eq('organization_id', member.organization_id)
    .eq('role', member.role)
    .eq('module', module)
    .eq('action', action)
    .single();

  return permission?.allowed || false;
}
