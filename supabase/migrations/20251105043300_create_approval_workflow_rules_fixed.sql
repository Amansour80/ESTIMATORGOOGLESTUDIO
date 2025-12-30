/*
  # Create Approval Workflow Rules Table
  
  ## Overview
  This migration creates the approval_workflow_rules table that defines conditions
  for when each workflow should be applied to a project.
  
  ## New Tables
  
  ### `approval_workflow_rules`
  Stores conditional rules that determine workflow selection.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique rule identifier
  - `workflow_id` (uuid, foreign key) - Links to approval_workflows table
  - `rule_group` (int) - Groups rules for AND conditions
  - `field_name` (text) - Project field to evaluate
  - `operator` (text) - Comparison operator
  - `value` (jsonb) - Value(s) to compare against
  - `logical_operator` (text) - AND or OR between rule groups
  - `priority` (int) - Rule evaluation order
  - `created_at` (timestamptz) - Creation timestamp
  
  ## Security
  - Enable RLS on approval_workflow_rules table
  - Organization members can view
  - Admins can create/update/delete
  - Super admins have full access
*/

-- Create enums for rule operators
DO $$ BEGIN
  CREATE TYPE rule_operator AS ENUM (
    'equals',
    'not_equals',
    'greater_than',
    'greater_than_or_equal',
    'less_than',
    'less_than_or_equal',
    'between',
    'in',
    'not_in',
    'contains',
    'not_contains'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE logical_operator AS ENUM ('AND', 'OR');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create approval_workflow_rules table
CREATE TABLE IF NOT EXISTS approval_workflow_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES approval_workflows(id) ON DELETE CASCADE,
  rule_group int NOT NULL DEFAULT 1,
  field_name text NOT NULL,
  operator rule_operator NOT NULL,
  value jsonb NOT NULL,
  logical_operator logical_operator DEFAULT 'AND',
  priority int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_field_name CHECK (field_name IN (
    'project_value',
    'calculated_value',
    'profit_margin',
    'project_type',
    'client_name',
    'duration_months',
    'total_labor_cost',
    'total_material_cost'
  ))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_rules_workflow_id 
  ON approval_workflow_rules(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_priority 
  ON approval_workflow_rules(workflow_id, priority);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_field 
  ON approval_workflow_rules(field_name);

-- Enable RLS
ALTER TABLE approval_workflow_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organization members can view rules for their workflows
CREATE POLICY "Organization members can view workflow rules"
  ON approval_workflow_rules
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

-- Admins can create rules for their workflows
CREATE POLICY "Admins can create workflow rules"
  ON approval_workflow_rules
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

-- Admins can update rules for their workflows
CREATE POLICY "Admins can update workflow rules"
  ON approval_workflow_rules
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

-- Admins can delete rules for their workflows
CREATE POLICY "Admins can delete workflow rules"
  ON approval_workflow_rules
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
CREATE POLICY "Super admins have full access to workflow rules"
  ON approval_workflow_rules
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM super_admins 
      WHERE user_id = auth.uid()
    )
  );

-- Function to evaluate a single rule
CREATE OR REPLACE FUNCTION evaluate_rule(
  p_field_value jsonb,
  p_operator rule_operator,
  p_rule_value jsonb
)
RETURNS boolean AS $$
DECLARE
  result boolean;
  numeric_field numeric;
  numeric_rule numeric;
BEGIN
  CASE p_operator
    WHEN 'equals' THEN
      result := p_field_value = p_rule_value;
      
    WHEN 'not_equals' THEN
      result := p_field_value != p_rule_value;
      
    WHEN 'greater_than' THEN
      numeric_field := (p_field_value)::text::numeric;
      numeric_rule := (p_rule_value)::text::numeric;
      result := numeric_field > numeric_rule;
      
    WHEN 'greater_than_or_equal' THEN
      numeric_field := (p_field_value)::text::numeric;
      numeric_rule := (p_rule_value)::text::numeric;
      result := numeric_field >= numeric_rule;
      
    WHEN 'less_than' THEN
      numeric_field := (p_field_value)::text::numeric;
      numeric_rule := (p_rule_value)::text::numeric;
      result := numeric_field < numeric_rule;
      
    WHEN 'less_than_or_equal' THEN
      numeric_field := (p_field_value)::text::numeric;
      numeric_rule := (p_rule_value)::text::numeric;
      result := numeric_field <= numeric_rule;
      
    WHEN 'between' THEN
      numeric_field := (p_field_value)::text::numeric;
      result := numeric_field BETWEEN 
        (p_rule_value->0)::text::numeric AND 
        (p_rule_value->1)::text::numeric;
      
    WHEN 'in' THEN
      result := p_field_value IN (SELECT jsonb_array_elements(p_rule_value));
      
    WHEN 'not_in' THEN
      result := p_field_value NOT IN (SELECT jsonb_array_elements(p_rule_value));
      
    WHEN 'contains' THEN
      result := (p_field_value)::text ILIKE '%' || (p_rule_value)::text || '%';
      
    WHEN 'not_contains' THEN
      result := (p_field_value)::text NOT ILIKE '%' || (p_rule_value)::text || '%';
      
    ELSE
      result := false;
  END CASE;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to evaluate all rules for a workflow
CREATE OR REPLACE FUNCTION evaluate_workflow_rules(
  p_workflow_id uuid,
  p_project_data jsonb
)
RETURNS boolean AS $$
DECLARE
  rule_record RECORD;
  group_result boolean;
  current_group int;
  final_result boolean;
  group_results boolean[] := ARRAY[]::boolean[];
  group_operators logical_operator[] := ARRAY[]::logical_operator[];
BEGIN
  -- Get all rules for this workflow, ordered by rule_group and priority
  FOR rule_record IN 
    SELECT *
    FROM approval_workflow_rules
    WHERE workflow_id = p_workflow_id
    ORDER BY rule_group, priority
  LOOP
    -- If we're starting a new group, save the previous group result
    IF current_group IS NOT NULL AND current_group != rule_record.rule_group THEN
      group_results := array_append(group_results, group_result);
      group_operators := array_append(group_operators, rule_record.logical_operator);
      group_result := NULL;
    END IF;
    
    current_group := rule_record.rule_group;
    
    -- Evaluate this rule
    DECLARE
      field_value jsonb;
      rule_result boolean;
    BEGIN
      field_value := p_project_data->rule_record.field_name;
      rule_result := evaluate_rule(field_value, rule_record.operator, rule_record.value);
      
      -- AND rules within the same group
      IF group_result IS NULL THEN
        group_result := rule_result;
      ELSE
        group_result := group_result AND rule_result;
      END IF;
    END;
  END LOOP;
  
  -- Add the last group result
  IF group_result IS NOT NULL THEN
    group_results := array_append(group_results, group_result);
  END IF;
  
  -- If no rules, workflow always matches
  IF array_length(group_results, 1) IS NULL THEN
    RETURN true;
  END IF;
  
  -- Combine group results using logical operators
  final_result := group_results[1];
  FOR i IN 2..array_length(group_results, 1) LOOP
    IF group_operators[i-1] = 'AND' THEN
      final_result := final_result AND group_results[i];
    ELSE
      final_result := final_result OR group_results[i];
    END IF;
  END LOOP;
  
  RETURN final_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;