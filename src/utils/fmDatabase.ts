import { supabase } from '../lib/supabase';
import type { FMEstimatorState } from '../types/fm';
import type { ProjectStatus, StatusHistoryEntry } from '../types/projectStatus';
import { getDefaultFMState } from './fmDefaults';
import { calculateFMResults } from './fmCalculations';

export interface SavedProject {
  id: string;
  user_id: string;
  project_name: string;
  project_data: FMEstimatorState;
  created_at: string;
  updated_at: string;
  status: ProjectStatus;
  submitted_at?: string;
  awarded_at?: string;
  lost_at?: string;
  cancelled_at?: string;
  status_history: StatusHistoryEntry[];
}

function migrateLegacyProjectData(data: any): FMEstimatorState {
  try {
    if (!data || typeof data !== 'object') {
      console.warn('Invalid project data structure, using defaults');
      return getDefaultFMState();
    }

    const migratedData = { ...data };

    if (!Array.isArray(migratedData.technicianLibrary)) {
      migratedData.technicianLibrary = [];
    } else {
      migratedData.technicianLibrary = migratedData.technicianLibrary.map((tech: any) => ({
        ...tech,
        skillTags: Array.isArray(tech.skillTags) ? tech.skillTags : (tech.skill_tags || []),
        canSupervise: tech.canSupervise ?? false,
        deploymentModel: tech.deploymentModel || 'resident',
        inputBaseCount: tech.inputBaseCount ?? 0,
      }));
    }

    if (!Array.isArray(migratedData.deployedTechnicians)) {
      if (migratedData.globalAssumptions?.contractMode === 'input_base' && Array.isArray(migratedData.technicianLibrary)) {
        migratedData.deployedTechnicians = migratedData.technicianLibrary
          .filter((tech: any) => tech.inputBaseCount > 0)
          .map((tech: any) => ({
            id: `deployed-${tech.id}-${Date.now()}`,
            technicianTypeId: tech.id,
            quantity: tech.inputBaseCount,
            notes: '',
          }));
      } else {
        migratedData.deployedTechnicians = [];
      }
    }

    if (!migratedData.supervisory || typeof migratedData.supervisory !== 'object') {
      migratedData.supervisory = {
        supportRoles: [],
      };
    } else {
      if (migratedData.supervisory.mode || migratedData.supervisory.manualCount) {
        migratedData.supervisory = {
          supportRoles: [],
        };
      } else if (!Array.isArray(migratedData.supervisory.supportRoles)) {
        migratedData.supervisory.supportRoles = [];
      }
    }

    if (!Array.isArray(migratedData.assetTypes)) {
      migratedData.assetTypes = [];
    } else {
      migratedData.assetTypes = migratedData.assetTypes.map((asset: any) => {
        const migratedAsset = { ...asset };

        if (!Array.isArray(migratedAsset.ppmTasks)) {
          migratedAsset.ppmTasks = [];
        } else {
          migratedAsset.ppmTasks = migratedAsset.ppmTasks.map((task: any) => ({
            ...task,
            technicianTypeId: task.technicianTypeId || '',
          }));
        }

        if (!migratedAsset.reactive || typeof migratedAsset.reactive !== 'object') {
          migratedAsset.reactive = {
            technicianTypeId: '',
            reactiveCallsPercent: 0,
            avgHoursPerCall: 0,
          };
        } else {
          const reactive = migratedAsset.reactive;

          if (reactive.estimatedCallsPerYear !== undefined && !reactive.reactiveCallsPercent) {
            reactive.reactiveCallsPercent = reactive.estimatedCallsPerYear || 0;
            delete reactive.estimatedCallsPerYear;
          }

          migratedAsset.reactive = {
            technicianTypeId: reactive.technicianTypeId || '',
            reactiveCallsPercent: reactive.reactiveCallsPercent ?? 0,
            avgHoursPerCall: reactive.avgHoursPerCall ?? 0,
          };
        }

        // Migrate responsibility from inventory to asset type
        if (!migratedAsset.responsibility) {
          // Check if any inventory item for this asset has a responsibility
          const inventoryItem = migratedData.assetInventory?.find(
            (inv: any) => inv.assetTypeId === migratedAsset.id
          );
          migratedAsset.responsibility = inventoryItem?.responsibility || 'in_house';
        }

        return migratedAsset;
      });
    }

    if (!Array.isArray(migratedData.assetInventory)) {
      migratedData.assetInventory = [];
    } else {
      // Remove responsibility field from inventory items (now managed at asset type level)
      migratedData.assetInventory = migratedData.assetInventory.map((inv: any) => {
        const { responsibility, ...rest } = inv;
        return rest;
      });
    }

    if (!Array.isArray(migratedData.materialsCatalog)) {
      migratedData.materialsCatalog = [];
    }

    if (!Array.isArray(migratedData.consumablesCatalog)) {
      migratedData.consumablesCatalog = [];
    }

    if (!Array.isArray(migratedData.specializedServices)) {
      migratedData.specializedServices = [];
    } else {
      migratedData.specializedServices = migratedData.specializedServices.map((service: any) => {
        const updated = {
          ...service,
          linkedAssetTypeIds: service.linkedAssetTypeIds || [],
        };

        if (service.monthlyCost !== undefined && service.annualCost === undefined) {
          updated.annualCost = service.monthlyCost * 12;
          delete updated.monthlyCost;
        }

        return updated;
      });
    }

    if (!migratedData.contractModel || typeof migratedData.contractModel !== 'object') {
      migratedData.contractModel = {
        global: 'fully_comprehensive',
        categoryOverrides: {},
        costPlusHandlingFee: 10,
      };
    } else {
      if (!migratedData.contractModel.categoryOverrides) {
        migratedData.contractModel.categoryOverrides = {};
      }
    }

    if (!migratedData.costConfig || typeof migratedData.costConfig !== 'object') {
      migratedData.costConfig = {
        inHouse: {
          overheadsPercent: 10,
          markupPercent: 15,
        },
        subcontract: {
          overheadsPercent: 5,
          markupPercent: 10,
        },
      };
    }

    if (!migratedData.globalAssumptions || typeof migratedData.globalAssumptions !== 'object') {
      migratedData.globalAssumptions = {
        contractMode: 'output_base',
        useIndustryStandard: false,
        totalCoverageDaysPerYear: 365,
        annualLeaveDays: 30,
        sickLeaveDays: 10,
        publicHolidayDays: 10,
        weeklyOffDays: 52,
        shiftLength: 12,
        breakMinutes: 60,
        coverageFactor: 1.5,
        effectiveHours: 11,
        transportationMinutes: 0,
        overtimeMode: 'manual',
        overtimeMultiplier: 1.5,
        overtimeThresholdPercent: 15,
      };
    } else {
      const ga = migratedData.globalAssumptions;

      if (!ga.contractMode) {
        ga.contractMode = 'output_base';
      }
      if (typeof ga.useIndustryStandard === 'undefined') {
        ga.useIndustryStandard = false;
      }
      if (typeof ga.useAssetLibrary === 'undefined') {
        ga.useAssetLibrary = true;
      }
      if (!ga.totalCoverageDaysPerYear) {
        ga.totalCoverageDaysPerYear = ga.workingDaysPerYear || 365;
      }
      if (!ga.annualLeaveDays) {
        ga.annualLeaveDays = 30;
      }
      if (!ga.sickLeaveDays) {
        ga.sickLeaveDays = 10;
      }
      if (!ga.publicHolidayDays) {
        ga.publicHolidayDays = 10;
      }
      if (!ga.weeklyOffDays) {
        ga.weeklyOffDays = 52;
      }
    }

    if (!migratedData.projectInfo || typeof migratedData.projectInfo !== 'object') {
      migratedData.projectInfo = {
        projectName: '',
        projectLocation: '',
        projectType: '',
      };
    }

    return migratedData as FMEstimatorState;
  } catch (error) {
    console.error('Error in migrateLegacyProjectData:', error);
    return getDefaultFMState();
  }
}

export const saveProject = async (
  projectName: string,
  projectData: FMEstimatorState
): Promise<{ success: boolean; error?: string; projectId?: string }> => {
  try {
    if (!projectData || Object.keys(projectData).length === 0) {
      return { success: false, error: 'Invalid project data' };
    }

    if (!projectName || !projectName.trim()) {
      return { success: false, error: 'Project name is required' };
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const results = calculateFMResults(projectData);
    const calculatedValue = results.grandTotal;

    const { data, error } = await supabase
      .from('fm_projects')
      .insert({
        user_id: user.id,
        project_name: projectName,
        client_name: projectData.projectInfo.clientName || null,
        calculated_value: calculatedValue,
        project_data: projectData,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error saving project:', error);
      return { success: false, error: error.message };
    }

    return { success: true, projectId: data.id };
  } catch (error) {
    console.error('Exception saving project:', error);
    return { success: false, error: 'Failed to save project' };
  }
};

export const updateProject = async (
  projectId: string,
  projectName: string,
  projectData: FMEstimatorState
): Promise<{ success: boolean; error?: string }> => {
  try {
    const results = calculateFMResults(projectData);
    const calculatedValue = results.grandTotal;

    const { error } = await supabase
      .from('fm_projects')
      .update({
        project_name: projectName,
        client_name: projectData.projectInfo.clientName || null,
        calculated_value: calculatedValue,
        project_data: projectData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update project' };
  }
};

export const getFMProjectsCount = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return 0;
    }

    const { count, error } = await supabase
      .from('fm_projects')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting FM projects count:', error);
    return 0;
  }
};

export const loadProjects = async (): Promise<{
  success: boolean;
  projects?: SavedProject[];
  error?: string;
}> => {
  try {
    // Refresh the session to ensure RLS policies use the latest auth context
    const { data: sessionData, error: sessionError } = await supabase.auth.refreshSession();

    if (sessionError) {
      console.error('loadProjects: Session refresh error:', sessionError);
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('loadProjects: User not authenticated');
      return { success: false, error: 'User not authenticated' };
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const organizationId = membership?.organization_id;

    const { data, error } = await supabase
      .from('fm_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('loadProjects: Error loading projects:', error);
      return { success: false, error: error.message };
    }

    const migratedProjects = (data || []).map((project: any) => {
      try {
        return {
          ...project,
          project_data: migrateLegacyProjectData(project.project_data),
        };
      } catch (error) {
        console.error(`Error migrating project ${project.project_name}:`, error);
        return {
          ...project,
          project_data: getDefaultFMState(),
        };
      }
    });

    return { success: true, projects: migratedProjects as SavedProject[] };
  } catch (error) {
    console.error('loadProjects: Exception:', error);
    return { success: false, error: 'Failed to load projects' };
  }
};

export const deleteProject = async (
  projectId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('fm_projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete project' };
  }
};

export const duplicateProject = async (
  projectId: string,
  newProjectName: string
): Promise<{ success: boolean; error?: string; projectId?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: originalProject, error: fetchError } = await supabase
      .from('fm_projects')
      .select('project_data')
      .eq('id', projectId)
      .single();

    if (fetchError || !originalProject) {
      return { success: false, error: 'Failed to fetch original project' };
    }

    const { data, error } = await supabase
      .from('fm_projects')
      .insert({
        user_id: user.id,
        project_name: newProjectName,
        project_data: originalProject.project_data,
        status: 'DRAFT',
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, projectId: data.id };
  } catch (error) {
    return { success: false, error: 'Failed to duplicate project' };
  }
};

export const changeProjectStatus = async (
  projectId: string,
  newStatus: ProjectStatus
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('fm_projects')
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
