import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'https://wrjyiahnieckrflalllz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyanlpYWhuaWVja3JmbGFsbGx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODg5NDAsImV4cCI6MjA3NTA2NDk0MH0.mfObg_-1VVpVgAxHl66I7yHbuklN0XsDggGBMyMsw7c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportAssetsToCSV() {
  console.log('Fetching assets from database...');

  const { data, error } = await supabase.rpc('get_all_assets_with_ppms');

  if (error) {
    console.log('RPC function not available, using direct query...');

    const query = `
      SELECT
        a.standard_code,
        a.asset_name,
        a.category,
        a.description,
        p.task_name,
        p.frequency,
        p.hours_per_task,
        p.task_order
      FROM industry_standard_asset_library a
      LEFT JOIN industry_standard_ppm_tasks p ON p.asset_id = a.id
      ORDER BY a.category, a.asset_name, p.task_order
    `;

    const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', { query });

    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      return;
    }

    console.log('Data fetched successfully');
    return sqlData;
  }

  return data;
}

exportAssetsToCSV();
