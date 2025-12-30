/*
  # Enable Realtime for Project Management Tables
  
  1. Problem
    - Real-time updates are not working for project_activities and activity_dependencies tables
    - When changes are saved in the Gantt chart, the Activities table view doesn't update
    - Users have to navigate away and back to see changes
  
  2. Solution
    - Enable realtime for project_activities table
    - Enable realtime for activity_dependencies table
    - This allows the UI to receive live updates when activities are modified
*/

-- Enable realtime for project management tables
ALTER PUBLICATION supabase_realtime ADD TABLE project_activities;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_dependencies;
