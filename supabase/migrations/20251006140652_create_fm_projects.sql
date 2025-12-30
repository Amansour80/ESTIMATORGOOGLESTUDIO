/*
  # FM Estimator Projects Storage

  1. New Tables
    - `fm_projects`
      - `id` (uuid, primary key) - Unique project identifier
      - `user_id` (uuid) - Owner of the project (references auth.users)
      - `project_name` (text) - Name of the project
      - `project_data` (jsonb) - Complete FMEstimatorState as JSON
      - `created_at` (timestamptz) - Project creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `fm_projects` table
    - Users can only view their own projects
    - Users can only create projects for themselves
    - Users can only update their own projects
    - Users can only delete their own projects

  3. Indexes
    - Index on user_id for fast project lookups by user
    - Index on updated_at for sorting by recent activity
*/

CREATE TABLE IF NOT EXISTS fm_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_name text NOT NULL,
  project_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE fm_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON fm_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON fm_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON fm_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON fm_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fm_projects_user_id ON fm_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_fm_projects_updated_at ON fm_projects(updated_at DESC);
