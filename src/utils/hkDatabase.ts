import { supabase } from '../lib/supabase';
import type { EstimatorState } from '../types';
import type { ProjectStatus, StatusHistoryEntry } from '../types/projectStatus';
import { getDefaultState } from './defaults';
import {
  calculateWorkingDaysPerYear,
  calculateCoverageFactor,
  calculateManpowerCosts,
  calculateMachineryCosts,
  calculateConsumables,
  calculatePricing
} from './calculations';

export interface SavedHKProject {
  id: string;
  project_name: string;
  project_data: EstimatorState;
  created_at: string;
  updated_at: string;
  user_id: string;
  status: ProjectStatus;
  submitted_at?: string;
  awarded_at?: string;
  lost_at?: string;
  cancelled_at?: string;
  status_history: StatusHistoryEntry[];
}

function migrateLegacyHKData(data: any): EstimatorState {
  if (!data || typeof data !== 'object') {
    console.error('Invalid project data structure');
    return getDefaultState();
  }

  if (!data.projectInfo) {
    data.projectInfo = {
      projectName: '',
      clientName: '',
      location: '',
    };
  }

  if (!data.site) {
    data.site = {
      estimationMode: 'output_base',
      totalCoverageDaysPerYear: 365,
      annualLeaveDays: 30,
      sickLeaveDays: 10,
      publicHolidayDays: 10,
      weeklyOffDays: 52,
      shiftLengthHours: 12,
      inputBaseCleaners: 0,
    };
  } else {
    if (!data.site.estimationMode) {
      data.site.estimationMode = 'output_base';
    }
    if (data.site.inputBaseCleaners === undefined) {
      data.site.inputBaseCleaners = 0;
    }
    if (!data.site.totalCoverageDaysPerYear) {
      data.site.totalCoverageDaysPerYear = 365;
    }
    if (!data.site.annualLeaveDays) {
      data.site.annualLeaveDays = 30;
    }
    if (!data.site.sickLeaveDays) {
      data.site.sickLeaveDays = 10;
    }
    if (!data.site.publicHolidayDays) {
      data.site.publicHolidayDays = 10;
    }
    if (!data.site.weeklyOffDays) {
      data.site.weeklyOffDays = 52;
    }
    if (!data.site.shiftLengthHours) {
      data.site.shiftLengthHours = 12;
    }
  }

  if (!data.productivity) {
    data.productivity = {
      manualDetailSqmPerShift: 200,
      manualGeneralSqmPerShift: 300,
    };
  } else {
    // Migrate legacy field names
    if (data.productivity.detailedCleaningSqmPerHour !== undefined) {
      data.productivity.manualDetailSqmPerShift = data.productivity.detailedCleaningSqmPerHour * 6; // Convert hourly to per shift (6 hours)
      delete data.productivity.detailedCleaningSqmPerHour;
    }
    if (data.productivity.standardCleaningSqmPerHour !== undefined) {
      data.productivity.manualGeneralSqmPerShift = data.productivity.standardCleaningSqmPerHour * 6;
      delete data.productivity.standardCleaningSqmPerHour;
    }
    if (data.productivity.highLevelCleaningSqmPerHour !== undefined) {
      delete data.productivity.highLevelCleaningSqmPerHour;
    }
  }

  if (!data.areas) {
    data.areas = [];
  }

  if (!data.costs) {
    data.costs = {
      cleanerSalary: 1200,
      benefitsAllowances: 300,
      supervisorSalary: 3000,
      supervisorCount: 0,
      consumablesPerCleanerPerMonth: 150,
      ppePerCleanerPerYear: 250,
      overheadsPercent: 10,
      profitMarkupPercent: 15,
    };
  } else {
    // Migrate legacy field names
    if (data.costs.cleanerMonthlySalary !== undefined) {
      data.costs.cleanerSalary = data.costs.cleanerMonthlySalary;
      delete data.costs.cleanerMonthlySalary;
    }
    if (data.costs.cleanerBenefitsPercent !== undefined && data.costs.cleanerSalary) {
      data.costs.benefitsAllowances = Math.round(data.costs.cleanerSalary * (data.costs.cleanerBenefitsPercent / 100));
      delete data.costs.cleanerBenefitsPercent;
    }
    if (data.costs.profitMarginPercent !== undefined) {
      data.costs.profitMarkupPercent = data.costs.profitMarginPercent;
      delete data.costs.profitMarginPercent;
    }
    // Ensure all required fields exist with defaults
    if (data.costs.cleanerSalary === undefined) data.costs.cleanerSalary = 1200;
    if (data.costs.benefitsAllowances === undefined) data.costs.benefitsAllowances = 300;
    if (data.costs.supervisorSalary === undefined) data.costs.supervisorSalary = 3000;
    if (data.costs.supervisorCount === undefined) data.costs.supervisorCount = 0;
    if (data.costs.consumablesPerCleanerPerMonth === undefined) data.costs.consumablesPerCleanerPerMonth = 150;
    if (data.costs.ppePerCleanerPerYear === undefined) data.costs.ppePerCleanerPerYear = 250;
    if (data.costs.overheadsPercent === undefined) data.costs.overheadsPercent = 10;
    if (data.costs.profitMarkupPercent === undefined) data.costs.profitMarkupPercent = 15;
  }

  if (!data.machines) {
    data.machines = [];
  }

  return data as EstimatorState;
}

function calculateProjectValue(projectData: EstimatorState): number {
  try {
    const workingDaysPerYear = calculateWorkingDaysPerYear(
      projectData.site.annualLeaveDays,
      projectData.site.sickLeaveDays,
      projectData.site.publicHolidayDays,
      projectData.site.weeklyOffDays
    );

    const coverageFactor = projectData.site.totalCoverageDaysPerYear / workingDaysPerYear;

    const dailyTotals = projectData.areas.reduce((acc, area) => {
      const bucket = area.bucket;
      if (!acc[bucket]) acc[bucket] = 0;
      const freq = area.frequency === 'Daily' ? 1 : area.frequency === 'Weekly' ? 1/7 : 1/30;
      acc[bucket] += area.sqm * freq;
      return acc;
    }, {} as Record<string, number>);

    const machineDailyTotals = projectData.areas.reduce((acc, area) => {
      if (area.bucket.includes('Machine')) {
        const freq = area.frequency === 'Daily' ? 1 : area.frequency === 'Weekly' ? 1/7 : 1/30;
        acc += area.sqm * freq;
      }
      return acc;
    }, 0);

    let activeCleanersTotal = 0;
    if (projectData.site.estimationMode === 'input_base') {
      activeCleanersTotal = projectData.site.inputBaseCleaners || 0;
    } else {
      const manualDetail = dailyTotals['Manual-Detail'] || 0;
      const manualGeneral = dailyTotals['Manual-General'] || 0;
      const machineCleaners = projectData.machines.reduce((total, machine) => {
        const capacity = machine.sqmPerHour * machine.effectiveHoursPerShift;
        const required = machineDailyTotals / capacity;
        return total + (required * machine.quantity);
      }, 0);

      activeCleanersTotal =
        (manualDetail / projectData.productivity.manualDetailSqmPerShift) +
        (manualGeneral / projectData.productivity.manualGeneralSqmPerShift) +
        machineCleaners;
    }

    const relieversCount = Math.ceil(activeCleanersTotal * (coverageFactor - 1));
    const totalCleaners = activeCleanersTotal + relieversCount;

    const annualManpower = totalCleaners * 12 * (
      projectData.costs.cleanerSalary +
      projectData.costs.benefitsAllowances
    );

    const annualMachinery = projectData.machines.reduce((total, machine) => {
      const depreciation = (machine.cost * machine.quantity) / machine.lifeYears;
      const maintenance = depreciation * (machine.maintenancePercent / 100);
      return total + depreciation + maintenance;
    }, 0);

    const annualConsumables = totalCleaners * 12 * projectData.costs.consumablesPerCleanerPerMonth;
    const annualPPE = totalCleaners * projectData.costs.ppePerCleanerPerYear;
    const supervisorCost = projectData.costs.supervisorCount * 12 * projectData.costs.supervisorSalary;

    const totalDirectCost = annualManpower + annualMachinery + annualConsumables + annualPPE + supervisorCost;
    const overheads = totalDirectCost * (projectData.costs.overheadsPercent / 100);
    const totalCost = totalDirectCost + overheads;
    const profit = totalCost * (projectData.costs.profitMarkupPercent / 100);
    const finalPrice = totalCost + profit;

    return finalPrice;
  } catch (error) {
    console.error('Error calculating project value:', error);
    return 0;
  }
}

export async function saveHKProject(projectName: string, projectData: EstimatorState): Promise<{ success: boolean; error?: string; projectId?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const calculatedValue = calculateProjectValue(projectData);

    const { data, error } = await supabase
      .from('hk_projects')
      .insert([
        {
          project_name: projectName,
          client_name: projectData.projectInfo.clientName || null,
          calculated_value: calculatedValue,
          project_data: projectData,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return { success: true, projectId: data.id };
  } catch (error) {
    console.error('Error saving HK project:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateHKProject(projectId: string, projectName: string, projectData: EstimatorState): Promise<{ success: boolean; error?: string }> {
  try {
    const calculatedValue = calculateProjectValue(projectData);

    const { error } = await supabase
      .from('hk_projects')
      .update({
        project_name: projectName,
        client_name: projectData.projectInfo.clientName || null,
        calculated_value: calculatedValue,
        project_data: projectData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating HK project:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function getHKProjectsCount(): Promise<number> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return 0;
    }

    const { count, error } = await supabase
      .from('hk_projects')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting HK projects count:', error);
    return 0;
  }
}

export async function listHKProjects(): Promise<SavedHKProject[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data: membership } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const organizationId = membership?.organization_id;

    const { data, error } = await supabase
      .from('hk_projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const migratedProjects = (data || []).map((project: any) => {
      try {
        return {
          ...project,
          project_data: migrateLegacyHKData(project.project_data),
        };
      } catch (error) {
        console.error(`Error migrating project ${project.project_name}:`, error);
        return {
          ...project,
          project_data: getDefaultState(),
        };
      }
    });

    return migratedProjects as SavedHKProject[];
  } catch (error) {
    console.error('Error listing HK projects:', error);
    return [];
  }
}

export async function deleteHKProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('hk_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting HK project:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const changeHKProjectStatus = async (
  projectId: string,
  newStatus: ProjectStatus
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('hk_projects')
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
