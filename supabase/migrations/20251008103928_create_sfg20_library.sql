/*
  # Create SFG20 Asset Library System

  1. New Tables
    - `sfg20_asset_library`
      - `id` (uuid, primary key)
      - `sfg20_code` (text) - Official SFG20 asset code (e.g., "AHU-01")
      - `asset_name` (text) - Asset type name
      - `category` (text) - HVAC, Electrical, Plumbing, Fire, Lifts, BMS, Security, etc.
      - `description` (text) - Asset description
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `sfg20_ppm_tasks`
      - `id` (uuid, primary key)
      - `asset_id` (uuid, foreign key to sfg20_asset_library)
      - `task_name` (text) - Task description
      - `frequency` (text) - Weekly, Monthly, Quarterly, Semi-Annual, Annual, Biennial
      - `hours_per_task` (numeric) - Standard hours to complete task
      - `task_order` (integer) - Display order
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public read access (all users can view SFG20 library)
    - Only super admins can modify SFG20 library

  3. Indexes
    - Index on category for filtering
    - Index on sfg20_code for lookups
*/

CREATE TABLE IF NOT EXISTS sfg20_asset_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sfg20_code text NOT NULL UNIQUE,
  asset_name text NOT NULL,
  category text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sfg20_ppm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES sfg20_asset_library(id) ON DELETE CASCADE,
  task_name text NOT NULL,
  frequency text NOT NULL,
  hours_per_task numeric(10,2) NOT NULL DEFAULT 0,
  task_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sfg20_asset_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfg20_ppm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view SFG20 asset library"
  ON sfg20_asset_library FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert SFG20 assets"
  ON sfg20_asset_library FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can update SFG20 assets"
  ON sfg20_asset_library FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can delete SFG20 assets"
  ON sfg20_asset_library FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view SFG20 PPM tasks"
  ON sfg20_ppm_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super admins can insert SFG20 tasks"
  ON sfg20_ppm_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can update SFG20 tasks"
  ON sfg20_ppm_tasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can delete SFG20 tasks"
  ON sfg20_ppm_tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_sfg20_assets_category ON sfg20_asset_library(category);
CREATE INDEX IF NOT EXISTS idx_sfg20_assets_code ON sfg20_asset_library(sfg20_code);
CREATE INDEX IF NOT EXISTS idx_sfg20_tasks_asset_id ON sfg20_ppm_tasks(asset_id);
