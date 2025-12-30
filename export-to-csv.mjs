import fetch from 'node-fetch';
import * as fs from 'fs';

const SUPABASE_URL = 'https://wrjyiahnieckrflalllz.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyanlpYWhuaWVja3JmbGFsbGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODg5NDAsImV4cCI6MjA3NTA2NDk0MH0.mfObg_-1VVpVgAxHl66I7yHbuklN0XsDggGBMyMsw7c';

async function exportToCSV() {
  try {
    console.log('Fetching assets...');

    const assetsResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/industry_standard_asset_library?select=*&order=category.asc,asset_name.asc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!assetsResponse.ok) {
      throw new Error(`Assets fetch failed: ${assetsResponse.statusText}`);
    }

    const assets = await assetsResponse.json();
    console.log(`Found ${assets.length} assets`);

    console.log('Fetching PPM tasks...');

    const tasksResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/industry_standard_ppm_tasks?select=*&order=task_order.asc`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      }
    );

    if (!tasksResponse.ok) {
      throw new Error(`Tasks fetch failed: ${tasksResponse.statusText}`);
    }

    const tasks = await tasksResponse.json();
    console.log(`Found ${tasks.length} PPM tasks`);

    const tasksByAsset = {};
    tasks.forEach(task => {
      if (!tasksByAsset[task.asset_id]) {
        tasksByAsset[task.asset_id] = [];
      }
      tasksByAsset[task.asset_id].push(task);
    });

    const csvLines = [];
    csvLines.push('Category,Standard Code,Asset Name,Description,PPM Task,Frequency,Hours per Task');

    let totalRows = 0;
    assets.forEach(asset => {
      const assetTasks = tasksByAsset[asset.id] || [];

      if (assetTasks.length === 0) {
        csvLines.push(
          `"${escapeCSV(asset.category)}","${escapeCSV(asset.standard_code)}","${escapeCSV(asset.asset_name)}","${escapeCSV(asset.description)}","","",""`
        );
        totalRows++;
      } else {
        assetTasks
          .sort((a, b) => a.task_order - b.task_order)
          .forEach((task, index) => {
            csvLines.push(
              `"${escapeCSV(index === 0 ? asset.category : '')}","${escapeCSV(index === 0 ? asset.standard_code : '')}","${escapeCSV(index === 0 ? asset.asset_name : '')}","${escapeCSV(index === 0 ? asset.description : '')}","${escapeCSV(task.task_name)}","${escapeCSV(task.frequency)}","${task.hours_per_task}"`
            );
            totalRows++;
          });
      }
    });

    const csvContent = csvLines.join('\n');
    const outputPath = '/tmp/cc-agent/57955126/project/industry_standard_assets.csv';

    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`\n✓ CSV file created successfully!`);
    console.log(`  File: industry_standard_assets.csv`);
    console.log(`  Location: ${outputPath}`);
    console.log(`  Total rows: ${totalRows}`);
    console.log(`  Assets: ${assets.length}`);
    console.log(`  PPM Tasks: ${tasks.length}`);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

function escapeCSV(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '""');
}

exportToCSV();
