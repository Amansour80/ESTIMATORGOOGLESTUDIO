-- Export all Industry Standard Assets with their PPM Tasks
-- Copy and run this query in your Supabase SQL Editor
-- Then export the results to CSV/Excel using the "Download as CSV" button

SELECT
  a.category AS "Category",
  a.standard_code AS "Standard Code",
  a.asset_name AS "Asset Name",
  a.description AS "Description",
  p.task_name AS "PPM Task",
  p.frequency AS "Frequency",
  p.hours_per_task AS "Hours per Task",
  p.task_order AS "Task Order"
FROM public.industry_standard_asset_library a
LEFT JOIN public.industry_standard_ppm_tasks p ON p.asset_id = a.id
ORDER BY a.category, a.asset_name, p.task_order;
