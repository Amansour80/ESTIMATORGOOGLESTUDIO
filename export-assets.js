import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import * as fs from 'fs';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportAssetsToExcel() {
  console.log('Fetching assets from database...');

  const { data: assets, error: assetsError } = await supabase
    .from('industry_standard_asset_library')
    .select('*')
    .order('category', { ascending: true })
    .order('asset_name', { ascending: true });

  if (assetsError) {
    console.error('Error fetching assets:', assetsError);
    return;
  }

  console.log(`Found ${assets.length} assets`);

  console.log('Fetching PPM tasks...');
  const { data: tasks, error: tasksError } = await supabase
    .from('industry_standard_ppm_tasks')
    .select('*')
    .order('task_order', { ascending: true });

  if (tasksError) {
    console.error('Error fetching tasks:', tasksError);
    return;
  }

  console.log(`Found ${tasks.length} PPM tasks`);

  const tasksByAsset = {};
  tasks.forEach(task => {
    if (!tasksByAsset[task.asset_id]) {
      tasksByAsset[task.asset_id] = [];
    }
    tasksByAsset[task.asset_id].push(task);
  });

  const data = assets.map(asset => ({
    ...asset,
    industry_standard_ppm_tasks: tasksByAsset[asset.id] || []
  }));

  console.log(`Processing ${data.length} assets with tasks`);

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Industry Standard Assets');

  worksheet.columns = [
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Standard Code', key: 'standard_code', width: 20 },
    { header: 'Asset Name', key: 'asset_name', width: 35 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'PPM Task', key: 'task_name', width: 50 },
    { header: 'Frequency', key: 'frequency', width: 15 },
    { header: 'Hours per Task', key: 'hours_per_task', width: 15 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  let rowCount = 0;
  data.forEach((asset) => {
    const tasks = asset.industry_standard_ppm_tasks || [];

    if (tasks.length === 0) {
      worksheet.addRow({
        category: asset.category,
        standard_code: asset.standard_code,
        asset_name: asset.asset_name,
        description: asset.description,
        task_name: '',
        frequency: '',
        hours_per_task: '',
      });
      rowCount++;
    } else {
      tasks
        .sort((a, b) => a.task_order - b.task_order)
        .forEach((task, index) => {
          worksheet.addRow({
            category: index === 0 ? asset.category : '',
            standard_code: index === 0 ? asset.standard_code : '',
            asset_name: index === 0 ? asset.asset_name : '',
            description: index === 0 ? asset.description : '',
            task_name: task.task_name,
            frequency: task.frequency,
            hours_per_task: parseFloat(task.hours_per_task),
          });
          rowCount++;
        });
    }
  });

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1) {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }
  });

  const outputPath = '/tmp/industry_standard_assets.xlsx';
  await workbook.xlsx.writeFile(outputPath);

  console.log(`\nExcel file created successfully!`);
  console.log(`File location: ${outputPath}`);
  console.log(`Total rows: ${rowCount}`);
  console.log(`\nYou can download this file from the specified location.`);
}

exportAssetsToExcel();
