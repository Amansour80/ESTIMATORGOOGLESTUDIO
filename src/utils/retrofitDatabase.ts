import { supabase } from '../lib/supabase';
import { RetrofitState } from '../types/retrofit';
import type { ProjectStatus, StatusHistoryEntry } from '../types/projectStatus';
import { getDefaultRetrofitState } from './retrofitDefaults';
import { calculateRetrofitResults } from './retrofitCalculations';

export interface SavedRetrofitProject {
  id: string;
  user_id: string;
  project_name: string;
  project_data: RetrofitState;
  created_at: string;
  updated_at: string;
  status: ProjectStatus;
  submitted_at?: string;
  awarded_at?: string;
  lost_at?: string;
  cancelled_at?: string;
  status_history: StatusHistoryEntry[];
}

function migrateLegacyRetrofitData(data: any): RetrofitState {
  if (!data || typeof data !== 'object') {
    console.error('Invalid project data structure');
    return getDefaultRetrofitState();
  }

  if (!data.projectInfo) {
    data.projectInfo = {
      projectName: '',
      projectLocation: '',
      projectType: '',
    };
  }

  if (!data.phases) {
    data.phases = [];
  }

  if (!data.laborLibrary) {
    data.laborLibrary = [];
  }

  if (!data.manpowerPlan) {
    data.manpowerPlan = [];
  }

  if (!data.assets) {
    data.assets = [];
  }

  if (!data.materialsCatalog) {
    data.materialsCatalog = [];
  }

  if (!data.subcontractors) {
    data.subcontractors = [];
  }

  if (!data.supervisionRoles) {
    data.supervisionRoles = [];
  }

  if (!data.logistics) {
    data.logistics = [];
  }

  if (!data.costConfig) {
    data.costConfig = {
      overheadsPercent: 10,
      profitPercent: 15,
    };
  }

  return data as RetrofitState;
}

export async function saveRetrofitProject(projectName: string, projectData: RetrofitState, organizationId?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get organization_id if not provided
  let orgId = organizationId;
  if (!orgId) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) throw new Error('User is not a member of any organization');
    orgId = membership.organization_id;
  }

  // Load labor library for calculations
  const { data: laborData } = await supabase
    .from('org_retrofit_labor')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const orgLaborLibrary = laborData || [];

  // Calculate with proper labor library
  const results = calculateRetrofitResults(projectData, orgLaborLibrary);
  const calculatedValue = results.grandTotal;

  const { data: existing } = await supabase
    .from('retrofit_projects')
    .select('id')
    .eq('project_name', projectName)
    .eq('organization_id', orgId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('retrofit_projects')
      .update({
        client_name: projectData.projectInfo.clientName || null,
        calculated_value: calculatedValue,
        project_data: projectData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (error) throw error;
    return { success: true, message: 'Project updated successfully', projectId: existing.id };
  } else {
    const { data, error } = await supabase.from('retrofit_projects').insert({
      user_id: user.id,
      organization_id: orgId,
      project_name: projectName,
      client_name: projectData.projectInfo.clientName || null,
      calculated_value: calculatedValue,
      project_data: projectData,
    })
    .select()
    .single();

    if (error) throw error;
    return { success: true, message: 'Project saved successfully', projectId: data.id };
  }
}

export async function loadRetrofitProject(projectName: string): Promise<RetrofitState | null> {
  const { data, error } = await supabase
    .from('retrofit_projects')
    .select('project_data')
    .eq('project_name', projectName)
    .maybeSingle();

  if (error) throw error;
  return data ? migrateLegacyRetrofitData(data.project_data) : null;
}

export async function getRetrofitProjectsCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return 0;
    }

    const { count, error } = await supabase
      .from('retrofit_projects')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting Retrofit projects count:', error);
    return 0;
  }
}

export async function listRetrofitProjects(): Promise<SavedRetrofitProject[]> {
  // Refresh the session to ensure RLS policies use the latest auth context
  await supabase.auth.refreshSession();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('listRetrofitProjects: User not authenticated');
    return [];
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .maybeSingle();

  const organizationId = membership?.organization_id;

  const { data, error } = await supabase
    .from('retrofit_projects')
    .select('*')
    .order('updated_at', { ascending: false});

  if (error) {
    console.error('listRetrofitProjects: Error loading projects:', error);
    throw error;
  }

  const migratedProjects = (data || []).map((project: any) => {
    try {
      return {
        ...project,
        project_data: migrateLegacyRetrofitData(project.project_data),
      };
    } catch (error) {
      console.error(`Error migrating project ${project.project_name}:`, error);
      return {
        ...project,
        project_data: getDefaultRetrofitState(),
      };
    }
  });

  return migratedProjects as SavedRetrofitProject[];
}

export async function deleteRetrofitProject(projectName: string) {
  const { error } = await supabase.from('retrofit_projects').delete().eq('project_name', projectName);

  if (error) throw error;
  return { success: true, message: 'Project deleted successfully' };
}

export const changeRetrofitProjectStatus = async (
  projectId: string,
  newStatus: ProjectStatus
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('retrofit_projects')
      .update({ status: newStatus })
      .eq('id', projectId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to change project status' };
  }
};
