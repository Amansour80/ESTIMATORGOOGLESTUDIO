/*
  # Cost Deletion Audit System

  1. New Tables
    - `cost_deletion_audit_log`
      - `id` (uuid, primary key)
      - `actual_cost_id` (uuid, reference to deleted cost)
      - `project_id` (uuid)
      - `cost_type` (text)
      - `cost_description` (text)
      - `total_amount` (numeric)
      - `original_status` (text)
      - `deletion_reason` (text)
      - `deleted_by` (uuid)
      - `deleted_at` (timestamptz)
      - `cost_data_snapshot` (jsonb) - full snapshot of the cost and related entries
  
  2. Security
    - Enable RLS on cost_deletion_audit_log
    - Only organization members can view audit logs
    - Only system can insert (via function)
  
  3. Functions
    - `delete_actual_cost_with_audit` - Safely deletes cost with audit trail
    - `can_user_delete_cost` - Checks if user has permission to delete a cost
*/

-- Create cost deletion audit log table
CREATE TABLE IF NOT EXISTS cost_deletion_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actual_cost_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES retrofit_projects(id) ON DELETE CASCADE,
  cost_type text NOT NULL,
  cost_description text NOT NULL,
  total_amount numeric NOT NULL,
  original_status text NOT NULL,
  deletion_reason text,
  deleted_by uuid NOT NULL REFERENCES auth.users(id),
  deleted_at timestamptz DEFAULT now(),
  cost_data_snapshot jsonb NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_cost_deletion_audit_project ON cost_deletion_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_cost_deletion_audit_deleted_by ON cost_deletion_audit_log(deleted_by);
CREATE INDEX IF NOT EXISTS idx_cost_deletion_audit_deleted_at ON cost_deletion_audit_log(deleted_at);

-- Enable RLS
ALTER TABLE cost_deletion_audit_log ENABLE ROW LEVEL SECURITY;

-- Organization members can view audit logs
CREATE POLICY "Organization members can view cost deletion audit logs"
  ON cost_deletion_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = cost_deletion_audit_log.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- Function to check if user can delete a cost
CREATE OR REPLACE FUNCTION can_user_delete_cost(
  p_cost_id uuid,
  p_user_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost_status text;
  v_org_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get cost status and organization
  SELECT 
    ac.status,
    rp.organization_id
  INTO v_cost_status, v_org_id
  FROM actual_costs ac
  JOIN retrofit_projects rp ON ac.project_id = rp.id
  WHERE ac.id = p_cost_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Draft costs can be deleted by anyone with project access
  IF v_cost_status = 'draft' THEN
    RETURN EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.retrofit_project_id = (
        SELECT project_id FROM actual_costs WHERE id = p_cost_id
      )
      AND pm.user_id = p_user_id
    );
  END IF;

  -- For pending_review, reviewed, or rejected costs, check if user is org admin
  SELECT 
    COALESCE(om.role, 'member') IN ('owner', 'admin')
  INTO v_is_admin
  FROM organization_members om
  WHERE om.organization_id = v_org_id
  AND om.user_id = p_user_id;

  RETURN COALESCE(v_is_admin, false);
END;
$$;

-- Function to delete cost with audit trail
CREATE OR REPLACE FUNCTION delete_actual_cost_with_audit(
  p_cost_id uuid,
  p_user_id uuid,
  p_deletion_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cost_record actual_costs;
  v_cost_data_snapshot jsonb;
  v_can_delete boolean;
  v_labor_entries jsonb;
  v_material_entries jsonb;
  v_equipment_entries jsonb;
  v_subcontractor_entries jsonb;
  v_asset_entries jsonb;
BEGIN
  -- Check if user can delete this cost
  SELECT can_user_delete_cost(p_cost_id, p_user_id) INTO v_can_delete;
  
  IF NOT v_can_delete THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You do not have permission to delete this cost'
    );
  END IF;

  -- Get the cost record
  SELECT * INTO v_cost_record
  FROM actual_costs
  WHERE id = p_cost_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cost not found'
    );
  END IF;

  -- Require deletion reason for non-draft costs
  IF v_cost_record.status != 'draft' AND (p_deletion_reason IS NULL OR p_deletion_reason = '') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Deletion reason is required for non-draft costs'
    );
  END IF;

  -- Collect all related data for the snapshot
  SELECT jsonb_agg(to_jsonb(lce.*)) INTO v_labor_entries
  FROM labor_cost_entries lce
  WHERE lce.actual_cost_id = p_cost_id;

  SELECT jsonb_agg(to_jsonb(mce.*)) INTO v_material_entries
  FROM material_cost_entries mce
  WHERE mce.actual_cost_id = p_cost_id;

  SELECT jsonb_agg(to_jsonb(ece.*)) INTO v_equipment_entries
  FROM equipment_cost_entries ece
  WHERE ece.actual_cost_id = p_cost_id;

  SELECT jsonb_agg(to_jsonb(sce.*)) INTO v_subcontractor_entries
  FROM subcontractor_cost_entries sce
  WHERE sce.actual_cost_id = p_cost_id;

  SELECT jsonb_agg(to_jsonb(ace.*)) INTO v_asset_entries
  FROM asset_cost_entries ace
  WHERE ace.actual_cost_id = p_cost_id;

  -- Build complete snapshot
  v_cost_data_snapshot := jsonb_build_object(
    'cost', to_jsonb(v_cost_record),
    'labor_entries', COALESCE(v_labor_entries, '[]'::jsonb),
    'material_entries', COALESCE(v_material_entries, '[]'::jsonb),
    'equipment_entries', COALESCE(v_equipment_entries, '[]'::jsonb),
    'subcontractor_entries', COALESCE(v_subcontractor_entries, '[]'::jsonb),
    'asset_entries', COALESCE(v_asset_entries, '[]'::jsonb)
  );

  -- Insert audit log entry
  INSERT INTO cost_deletion_audit_log (
    actual_cost_id,
    project_id,
    cost_type,
    cost_description,
    total_amount,
    original_status,
    deletion_reason,
    deleted_by,
    cost_data_snapshot
  ) VALUES (
    p_cost_id,
    v_cost_record.project_id,
    v_cost_record.cost_type,
    v_cost_record.description,
    v_cost_record.total_amount,
    v_cost_record.status,
    p_deletion_reason,
    p_user_id,
    v_cost_data_snapshot
  );

  -- Delete related entries (cascade will handle this, but being explicit)
  DELETE FROM labor_cost_entries WHERE actual_cost_id = p_cost_id;
  DELETE FROM material_cost_entries WHERE actual_cost_id = p_cost_id;
  DELETE FROM equipment_cost_entries WHERE actual_cost_id = p_cost_id;
  DELETE FROM subcontractor_cost_entries WHERE actual_cost_id = p_cost_id;
  DELETE FROM asset_cost_entries WHERE actual_cost_id = p_cost_id;

  -- Delete the actual cost
  DELETE FROM actual_costs WHERE id = p_cost_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Cost deleted successfully'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_user_delete_cost TO authenticated;
GRANT EXECUTE ON FUNCTION delete_actual_cost_with_audit TO authenticated;

-- Enable realtime for audit log
ALTER PUBLICATION supabase_realtime ADD TABLE cost_deletion_audit_log;
