import { supabase } from '../lib/supabase';
import type { Node, Edge } from 'reactflow';

export interface ApprovalWorkflow {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRule {
  id: string;
  workflow_id: string;
  rule_group: number;
  field_name: string;
  operator: string;
  value: any;
  logical_operator: 'AND' | 'OR';
  priority: number;
  created_at: string;
}

export interface WorkflowCanvas {
  id: string;
  workflow_id: string;
  nodes: Node[];
  edges: Edge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  version: number;
  created_at: string;
  updated_at: string;
}

export async function getWorkflows(orgId: string): Promise<ApprovalWorkflow[]> {
  const { data, error } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('organization_id', orgId)
    .order('is_default', { ascending: false })
    .order('name');

  if (error) throw error;
  return data || [];
}

export async function getWorkflow(workflowId: string): Promise<ApprovalWorkflow | null> {
  const { data, error } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (error) throw error;
  return data;
}

export async function createWorkflow(
  orgId: string,
  name: string,
  description: string,
  isDefault: boolean = false
): Promise<ApprovalWorkflow> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('approval_workflows')
    .insert({
      organization_id: orgId,
      name,
      description,
      is_default: isDefault,
      created_by: userData.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateWorkflow(
  workflowId: string,
  updates: {
    name?: string;
    description?: string;
    is_active?: boolean;
    is_default?: boolean;
  }
): Promise<ApprovalWorkflow> {
  const { data, error } = await supabase
    .from('approval_workflows')
    .update(updates)
    .eq('id', workflowId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWorkflow(workflowId: string): Promise<void> {
  const { error } = await supabase
    .from('approval_workflows')
    .delete()
    .eq('id', workflowId);

  if (error) throw error;
}

export async function getWorkflowCanvas(workflowId: string): Promise<WorkflowCanvas | null> {
  const { data, error } = await supabase
    .from('approval_workflow_canvas')
    .select('*')
    .eq('workflow_id', workflowId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveWorkflowCanvas(
  workflowId: string,
  nodes: Node[],
  edges: Edge[],
  viewport: { x: number; y: number; zoom: number }
): Promise<WorkflowCanvas> {
  const existing = await getWorkflowCanvas(workflowId);

  if (existing) {
    const { data, error } = await supabase
      .from('approval_workflow_canvas')
      .update({
        nodes,
        edges,
        viewport,
      })
      .eq('workflow_id', workflowId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('approval_workflow_canvas')
      .insert({
        workflow_id: workflowId,
        nodes,
        edges,
        viewport,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function getWorkflowRules(workflowId: string): Promise<WorkflowRule[]> {
  const { data, error } = await supabase
    .from('approval_workflow_rules')
    .select('*')
    .eq('workflow_id', workflowId)
    .order('priority');

  if (error) throw error;
  return data || [];
}

export async function saveWorkflowRules(
  workflowId: string,
  rules: Omit<WorkflowRule, 'id' | 'workflow_id' | 'created_at'>[]
): Promise<WorkflowRule[]> {
  await supabase
    .from('approval_workflow_rules')
    .delete()
    .eq('workflow_id', workflowId);

  if (rules.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('approval_workflow_rules')
    .insert(
      rules.map((rule) => ({
        workflow_id: workflowId,
        ...rule,
      }))
    )
    .select();

  if (error) throw error;
  return data || [];
}

export async function duplicateWorkflow(
  workflowId: string,
  newName: string
): Promise<ApprovalWorkflow> {
  const workflow = await getWorkflow(workflowId);
  if (!workflow) throw new Error('Workflow not found');

  const newWorkflow = await createWorkflow(
    workflow.organization_id,
    newName,
    workflow.description || '',
    false
  );

  const canvas = await getWorkflowCanvas(workflowId);
  if (canvas) {
    await saveWorkflowCanvas(
      newWorkflow.id,
      canvas.nodes,
      canvas.edges,
      canvas.viewport
    );
  }

  const rules = await getWorkflowRules(workflowId);
  if (rules.length > 0) {
    await saveWorkflowRules(
      newWorkflow.id,
      rules.map(({ id, workflow_id, created_at, ...rule }) => rule)
    );
  }

  return newWorkflow;
}

export const FIELD_OPTIONS = [
  { value: 'project_value', label: 'Project Value' },
  { value: 'calculated_value', label: 'Calculated Value' },
  { value: 'profit_margin', label: 'Profit Margin' },
  { value: 'project_type', label: 'Project Type' },
  { value: 'client_name', label: 'Client Name' },
  { value: 'duration_months', label: 'Duration (Months)' },
  { value: 'total_labor_cost', label: 'Total Labor Cost' },
  { value: 'total_material_cost', label: 'Total Material Cost' },
];

export const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
  { value: 'less_than', label: 'Less Than' },
  { value: 'less_than_or_equal', label: 'Less Than or Equal' },
  { value: 'between', label: 'Between' },
  { value: 'in', label: 'In List' },
  { value: 'not_in', label: 'Not In List' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does Not Contain' },
];
