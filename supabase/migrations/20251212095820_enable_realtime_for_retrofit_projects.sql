/*
  # Enable Realtime for Retrofit Projects
  
  1. Problem
    - Real-time updates are not working for retrofit_projects table
    - UI doesn't reflect changes like overall_progress updates
  
  2. Solution
    - Enable realtime for retrofit_projects table
    - This allows the UI to receive live updates when progress changes
*/

-- Enable realtime for retrofit_projects table
ALTER PUBLICATION supabase_realtime ADD TABLE retrofit_projects;
