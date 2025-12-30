/*
  # Create retrofit_projects table

  1. New Tables
    - `retrofit_projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `project_name` (text, unique per user)
      - `project_data` (jsonb, stores complete retrofit state)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `retrofit_projects` table
    - Add policy for authenticated users to read their own projects
    - Add policy for authenticated users to insert their own projects
    - Add policy for authenticated users to update their own projects
    - Add policy for authenticated users to delete their own projects
  
  3. Indexes
    - Index on user_id for faster queries
    - Index on project_name for search
    - Index on updated_at for sorting
*/

CREATE TABLE IF NOT EXISTS retrofit_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  project_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_name)
);

ALTER TABLE retrofit_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own retrofit projects"
  ON retrofit_projects
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own retrofit projects"
  ON retrofit_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own retrofit projects"
  ON retrofit_projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own retrofit projects"
  ON retrofit_projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_retrofit_projects_user_id ON retrofit_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_name ON retrofit_projects(project_name);
CREATE INDEX IF NOT EXISTS idx_retrofit_projects_updated ON retrofit_projects(updated_at DESC);