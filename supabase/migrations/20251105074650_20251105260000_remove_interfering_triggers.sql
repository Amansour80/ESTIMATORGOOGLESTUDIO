/*
  # Remove Auto-Calculate Triggers

  ## Problem
  Triggers are interfering with application-level calculations
  The application code already calculates and sets calculated_value correctly
  
  ## Solution
  Remove the triggers and let application handle it
*/

DROP TRIGGER IF EXISTS hk_projects_calculate_value ON hk_projects;
DROP TRIGGER IF EXISTS fm_projects_calculate_value ON fm_projects;
DROP TRIGGER IF EXISTS retrofit_projects_calculate_value ON retrofit_projects;

DROP FUNCTION IF EXISTS calculate_hk_project_value();
DROP FUNCTION IF EXISTS calculate_fm_project_value();
DROP FUNCTION IF EXISTS calculate_retrofit_project_value();