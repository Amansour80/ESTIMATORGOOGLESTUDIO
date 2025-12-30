/*
  # Create Approval Workflow Canvas System
  
  ## Overview
  This migration creates the approval_workflow_canvas table that stores the visual
  workflow design created with React Flow. It stores nodes, edges, and viewport data.
  
  ## New Tables
  
  ### `approval_workflow_canvas`
  Stores React Flow canvas data for visual workflow builder.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique canvas identifier
  - `workflow_id` (uuid, foreign key) - Links to approval_workflows table (one-to-one)
  - `nodes` (jsonb) - React Flow nodes array with positions and configurations
  - `edges` (jsonb) - React Flow edges array defining connections
  - `viewport` (jsonb) - Canvas viewport state (x, y, zoom)
  - `version` (int) - Version number for tracking changes
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - Enable RLS on approval_workflow_canvas table
  - Same access patterns as workflows
  - Super admins have full access
  
  ## Notes
  - One canvas per workflow (one-to-one relationship)
  - Nodes include approval steps, conditions, actions, start/end
  - Edges define the flow between nodes
  - Viewport stores the canvas position and zoom level
*/

-- Create approval_workflow_canvas table
CREATE TABLE IF NOT EXISTS approval_workflow_canvas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  viewport jsonb DEFAULT '{"x": 0, "y": 0, "zoom": 1}'::jsonb,
  version int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT unique_workflow_canvas UNIQUE (workflow_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_canvas_workflow_id 
  ON approval_workflow_canvas(workflow_id);

-- Enable RLS
ALTER TABLE approval_workflow_canvas ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organization members can view canvas for their workflows
CREATE POLICY "Organization members can view workflow canvas"
  ON approval_workflow_canvas
  FOR SELECT
  TO authenticated
  USING (
    workflow_id IN (
      SELECT w.id FROM approval_workflows w
      WHERE w.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can create canvas for their workflows
CREATE POLICY "Admins can create workflow canvas"
  ON approval_workflow_canvas
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workflow_id IN (
      SELECT w.id FROM approval_workflows w
      WHERE w.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
      )
    )
  );

-- Admins can update canvas for their workflows
CREATE POLICY "Admins can update workflow canvas"
  ON approval_workflow_canvas
  FOR UPDATE
  TO authenticated
  USING (
    workflow_id IN (
      SELECT w.id FROM approval_workflows w
      WHERE w.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
      )
    )
  )
  WITH CHECK (
    workflow_id IN (
      SELECT w.id FROM approval_workflows w
      WHERE w.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
      )
    )
  );

-- Admins can delete canvas for their workflows
CREATE POLICY "Admins can delete workflow canvas"
  ON approval_workflow_canvas
  FOR DELETE
  TO authenticated
  USING (
    workflow_id IN (
      SELECT w.id FROM approval_workflows w
      WHERE w.organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() 
          AND role IN ('owner', 'admin')
      )
    )
  );

-- Super admins can do everything
CREATE POLICY "Super admins have full access to workflow canvas"
  ON approval_workflow_canvas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workflow_canvas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update updated_at and version
DROP TRIGGER IF EXISTS update_workflow_canvas_updated_at_trigger 
  ON approval_workflow_canvas;
CREATE TRIGGER update_workflow_canvas_updated_at_trigger
  BEFORE UPDATE ON approval_workflow_canvas
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_canvas_updated_at();

-- Helper function to get workflow canvas
CREATE OR REPLACE FUNCTION get_workflow_canvas(p_workflow_id uuid)
RETURNS TABLE (
  nodes jsonb,
  edges jsonb,
  viewport jsonb,
  version int
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.nodes,
    c.edges,
    c.viewport,
    c.version
  FROM approval_workflow_canvas c
  WHERE c.workflow_id = p_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;