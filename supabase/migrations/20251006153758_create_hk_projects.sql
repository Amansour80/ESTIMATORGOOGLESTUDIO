/*
  # Create housekeeping projects table

  1. New Tables
    - `hk_projects`
      - `id` (uuid, primary key)
      - `project_name` (text, not null)
      - `project_data` (jsonb, not null) - stores the complete HK estimator state
      - `user_id` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `hk_projects` table
    - Add policy for users to manage their own projects
    
  3. Indexes
    - Index on user_id for faster queries
    - Index on updated_at for sorting
*/

CREATE TABLE IF NOT EXISTS hk_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  project_data jsonb NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE hk_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own HK projects"
  ON hk_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own HK projects"
  ON hk_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own HK projects"
  ON hk_projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own HK projects"
  ON hk_projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_hk_projects_user_id ON hk_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_hk_projects_updated_at ON hk_projects(updated_at DESC);
