import { supabase } from '../lib/supabase';
import type { IndustryStandardAssetLibraryItem, IndustryStandardTask } from '../types/fm';

interface AssetWithTasks extends IndustryStandardAssetLibraryItem {
  tasks?: IndustryStandardTask[];
}

export async function exportAssetLibraryToCSV(
  selectedCategories: string[],
  includeDetails: 'assets_only' | 'with_ppms'
): Promise<void> {
  try {
    const { data: assets, error: assetsError } = await supabase
      .from('industry_standard_asset_library')
      .select('*')
      .in('category', selectedCategories)
      .order('category', { ascending: true })
      .order('asset_name', { ascending: true });

    if (assetsError) throw assetsError;
    if (!assets || assets.length === 0) {
      alert('No assets found for the selected categories');
      return;
    }

    let csvContent = '';

    if (includeDetails === 'assets_only') {
      csvContent = generateAssetsOnlyCSV(assets);
    } else {
      const { data: tasks, error: tasksError } = await supabase
        .from('industry_standard_ppm_tasks')
        .select('*')
        .in('asset_id', assets.map(a => a.id))
        .order('task_order', { ascending: true });

      if (tasksError) throw tasksError;

      const assetsWithTasks = assets.map(asset => ({
        ...asset,
        tasks: tasks?.filter(t => t.asset_id === asset.id) || []
      }));

      csvContent = generateAssetsWithPPMsCSV(assetsWithTasks);
    }

    downloadCSV(csvContent, `asset_library_export_${Date.now()}.csv`);
  } catch (error) {
    console.error('Error exporting asset library:', error);
    alert('Failed to export asset library. Please try again.');
  }
}

function generateAssetsOnlyCSV(assets: IndustryStandardAssetLibraryItem[]): string {
  const headers = ['Category', 'Standard Code', 'Asset Name', 'Description'];
  const rows = assets.map(asset => [
    asset.category,
    asset.standard_code || '',
    asset.asset_name,
    asset.description || ''
  ]);

  return convertToCSV([headers, ...rows]);
}

function generateAssetsWithPPMsCSV(assets: AssetWithTasks[]): string {
  const headers = [
    'Category',
    'Standard Code',
    'Asset Name',
    'Description',
    'PPM Task',
    'Frequency',
    'Hours per Task',
    'Task Order'
  ];

  const rows: string[][] = [];

  assets.forEach(asset => {
    const tasks = asset.tasks || [];

    if (tasks.length === 0) {
      rows.push([
        asset.category,
        asset.standard_code || '',
        asset.asset_name,
        asset.description || '',
        '',
        '',
        '',
        ''
      ]);
    } else {
      tasks.forEach((task, index) => {
        rows.push([
          index === 0 ? asset.category : '',
          index === 0 ? (asset.standard_code || '') : '',
          index === 0 ? asset.asset_name : '',
          index === 0 ? (asset.description || '') : '',
          task.task_name,
          task.frequency,
          task.hours_per_task.toString(),
          task.task_order?.toString() || ''
        ]);
      });
    }
  });

  return convertToCSV([headers, ...rows]);
}

function convertToCSV(data: string[][]): string {
  return data.map(row =>
    row.map(cell => {
      const cellStr = String(cell || '');
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(',')
  ).join('\n');
}

function downloadCSV(content: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
