import { supabase } from '../lib/supabase';
import type { IndustryStandardAssetLibraryItem, IndustryStandardTask, AssetType } from '../types/fm';

export interface IndustryStandardAssetWithTasks extends IndustryStandardAssetLibraryItem {
  tasks: IndustryStandardTask[];
}

export async function fetchIndustryStandardAssets(): Promise<IndustryStandardAssetLibraryItem[]> {
  const { data, error } = await supabase
    .from('industry_standard_asset_library')
    .select('*')
    .order('category, asset_name');

  if (error) {
    console.error('Error fetching industry standard assets:', error);
    return [];
  }

  return data || [];
}

export async function fetchIndustryStandardAssetsByCategory(category: string): Promise<IndustryStandardAssetLibraryItem[]> {
  const { data, error } = await supabase
    .from('industry_standard_asset_library')
    .select('*')
    .eq('category', category)
    .order('asset_name');

  if (error) {
    console.error('Error fetching industry standard assets by category:', error);
    return [];
  }

  return data || [];
}

export async function fetchIndustryStandardCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('industry_standard_asset_library')
    .select('category')
    .order('category');

  if (error) {
    console.error('Error fetching industry standard categories:', error);
    return [];
  }

  const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
  return uniqueCategories;
}

export async function fetchIndustryStandardTasks(assetId: string): Promise<IndustryStandardTask[]> {
  const { data, error } = await supabase
    .from('industry_standard_ppm_tasks')
    .select('id, task_name, frequency, hours_per_task, task_order')
    .eq('asset_id', assetId)
    .order('task_order');

  if (error) {
    console.error('Error fetching industry standard tasks:', error);
    return [];
  }

  return data || [];
}

export async function fetchIndustryStandardAssetWithTasks(assetId: string): Promise<IndustryStandardAssetWithTasks | null> {
  const { data: asset, error: assetError } = await supabase
    .from('industry_standard_asset_library')
    .select('*')
    .eq('id', assetId)
    .maybeSingle();

  if (assetError || !asset) {
    console.error('Error fetching industry standard asset:', assetError);
    return null;
  }

  const tasks = await fetchIndustryStandardTasks(assetId);

  return {
    ...asset,
    tasks
  };
}

export async function fetchMultipleIndustryStandardAssetsWithTasks(assetIds: string[]): Promise<Map<string, IndustryStandardAssetWithTasks>> {
  const resultMap = new Map<string, IndustryStandardAssetWithTasks>();

  if (assetIds.length === 0) {
    return resultMap;
  }

  const { data: assets, error: assetsError } = await supabase
    .from('industry_standard_asset_library')
    .select('*')
    .in('id', assetIds);

  if (assetsError || !assets) {
    console.error('Error fetching multiple industry standard assets:', assetsError);
    return resultMap;
  }

  const { data: tasks, error: tasksError } = await supabase
    .from('industry_standard_ppm_tasks')
    .select('*')
    .in('asset_id', assetIds)
    .order('task_order');

  if (tasksError) {
    console.error('Error fetching multiple industry standard tasks:', tasksError);
    return resultMap;
  }

  const tasksByAssetId = new Map<string, IndustryStandardTask[]>();
  (tasks || []).forEach(task => {
    if (!tasksByAssetId.has(task.asset_id)) {
      tasksByAssetId.set(task.asset_id, []);
    }
    tasksByAssetId.get(task.asset_id)!.push({
      id: task.id,
      task_name: task.task_name,
      frequency: task.frequency,
      hours_per_task: task.hours_per_task,
      task_order: task.task_order
    });
  });

  assets.forEach(asset => {
    resultMap.set(asset.id, {
      ...asset,
      tasks: tasksByAssetId.get(asset.id) || []
    });
  });

  return resultMap;
}

export function convertIndustryStandardToAssetType(standardAsset: IndustryStandardAssetWithTasks): AssetType {
  const ppmTasks = standardAsset.tasks.map(task => ({
    id: crypto.randomUUID(),
    taskName: task.task_name,
    frequency: mapStandardFrequencyToFMFrequency(task.frequency),
    hoursPerVisit: task.hours_per_task,
    technicianTypeId: '',
  }));

  return {
    id: crypto.randomUUID(),
    category: standardAsset.category,
    assetName: standardAsset.asset_name,
    standardCode: standardAsset.standard_code,
    standardTasks: standardAsset.tasks,
    ppmTasks,
    reactive: {
      reactiveCallsPercent: 10,
      avgHoursPerCall: 2,
      technicianTypeId: '',
      isMonthlyRate: true,
    },
    responsibility: 'in_house',
    notes: standardAsset.description || '',
  };
}

function mapStandardFrequencyToFMFrequency(standardFrequency: string): 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual' {
  const freq = standardFrequency.toLowerCase();
  if (freq.includes('daily')) return 'daily';
  if (freq.includes('weekly')) return 'weekly';
  if (freq.includes('monthly')) return 'monthly';
  if (freq.includes('quarterly') || freq.includes('quarter')) return 'quarterly';
  if (freq.includes('semi') || freq.includes('6')) return 'semiannual';
  return 'annual';
}

export function calculateAnnualHoursFromIndustryStandardTasks(tasks: IndustryStandardTask[]): number {
  let totalHours = 0;

  tasks.forEach(task => {
    const freq = task.frequency.toLowerCase();
    let annualOccurrences = 1;

    if (freq.includes('weekly')) annualOccurrences = 52;
    else if (freq.includes('monthly')) annualOccurrences = 12;
    else if (freq.includes('quarterly')) annualOccurrences = 4;
    else if (freq.includes('semi')) annualOccurrences = 2;
    else if (freq.includes('biennial')) annualOccurrences = 0.5;
    else annualOccurrences = 1;

    totalHours += task.hours_per_task * annualOccurrences;
  });

  return totalHours;
}
