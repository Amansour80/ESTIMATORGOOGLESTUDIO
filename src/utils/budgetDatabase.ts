import { supabase } from '../lib/supabase';

export interface BudgetBaseline {
  id: string;
  project_id: string;
  baseline_version: number;
  total_budget: number;
  assets_budget: number;
  labor_budget: number;
  materials_budget: number;
  equipment_budget: number;
  subcontractor_budget: number;
  overhead_budget: number;
  contingency_budget: number;
  is_active: boolean;
  imported_from_estimation: boolean;
  created_at: string;
  created_by: string;
}

export interface ActivityBudgetAllocation {
  id: string;
  activity_id: string;
  cost_category: string;
  allocated_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CostCategory {
  id: string;
  organization_id: string;
  category_name: string;
  category_type: 'predefined' | 'custom';
  is_active: boolean;
  created_at: string;
}

export interface ActualCost {
  id: string;
  project_id: string;
  activity_id?: string;
  cost_type: 'labor' | 'material' | 'equipment' | 'subcontractor' | 'asset' | 'other';
  cost_category_id?: string;
  description: string;
  quantity?: number;
  unit_price?: number;
  total_amount: number;
  cost_date: string;
  document_id?: string;
  status: 'draft' | 'pending_review' | 'reviewed' | 'rejected';
  created_by: string;
  reviewed_by?: string;
  created_at: string;
  reviewed_at?: string;
}

export interface LaborCostEntry {
  id: string;
  actual_cost_id: string;
  manpower_type: string;
  trade?: string;
  num_workers: number;
  hours_worked?: number;
  days_worked?: number;
  rate_per_hour?: number;
  rate_per_day?: number;
  total_cost: number;
  work_date_start: string;
  work_date_end?: string;
  created_at: string;
}

export interface MaterialCostEntry {
  id: string;
  actual_cost_id: string;
  material_name: string;
  material_id?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_cost: number;
  supplier?: string;
  invoice_number?: string;
  created_at: string;
}

export interface EquipmentCostEntry {
  id: string;
  actual_cost_id: string;
  equipment_type: string;
  equipment_name: string;
  rental_days?: number;
  daily_rate?: number;
  total_cost: number;
  supplier?: string;
  created_at: string;
}

export interface SubcontractorCostEntry {
  id: string;
  actual_cost_id: string;
  subcontractor_name: string;
  invoice_number?: string;
  work_description: string;
  progress_percentage: number;
  retention_percentage: number;
  retention_amount: number;
  gross_amount: number;
  net_payable: number;
  created_at: string;
}

export interface AssetCostEntry {
  id: string;
  actual_cost_id: string;
  asset_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_cost: number;
  supplier?: string;
  purchase_order_number?: string;
  serial_numbers?: string;
  created_at: string;
}

export interface BudgetChangeOrder {
  id: string;
  project_id: string;
  change_order_number: string;
  title: string;
  description: string;
  reason?: string;
  requested_by: string;
  requested_at: string;
  current_budget: number;
  requested_budget_change: number;
  new_total_budget: number;
  impact_analysis?: string;
  status: 'draft' | 'pending_review' | 'reviewed' | 'rejected';
  workflow_id?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface ChangeOrderLineItem {
  id: string;
  change_order_id: string;
  category: string;
  current_allocation: number;
  requested_change: number;
  new_allocation: number;
  justification?: string;
  created_at: string;
}

export interface BudgetRevision {
  id: string;
  project_id: string;
  revision_number: number;
  baseline_id: string;
  revision_reason: string;
  total_budget: number;
  assets_budget: number;
  labor_budget: number;
  materials_budget: number;
  equipment_budget: number;
  subcontractor_budget: number;
  overhead_budget: number;
  contingency_budget: number;
  approved_by?: string;
  approved_at?: string;
  created_by: string;
  created_at: string;
}

export interface CostForecast {
  id: string;
  project_id: string;
  activity_id?: string;
  forecast_date: string;
  cost_type: string;
  forecasted_amount: number;
  confidence_level: string;
  assumptions?: string;
  created_by: string;
  created_at: string;
}

export const createBudgetBaseline = async (baseline: Omit<BudgetBaseline, 'id' | 'created_at' | 'created_by' | 'baseline_version' | 'is_active'>) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('budget_baselines')
    .select('baseline_version')
    .eq('project_id', baseline.project_id)
    .order('baseline_version', { ascending: false })
    .limit(1)
    .maybeSingle();

  const version = existing ? existing.baseline_version + 1 : 1;

  if (existing) {
    await supabase
      .from('budget_baselines')
      .update({ is_active: false })
      .eq('project_id', baseline.project_id)
      .eq('is_active', true);
  }

  const { data, error } = await supabase
    .from('budget_baselines')
    .insert([{
      ...baseline,
      baseline_version: version,
      is_active: true,
      created_by: user.user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBudgetBaseline = async (projectId: string) => {
  const { data, error } = await supabase
    .from('budget_baselines')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const getAllBudgetBaselines = async (projectId: string) => {
  const { data, error } = await supabase
    .from('budget_baselines')
    .select('*')
    .eq('project_id', projectId)
    .order('baseline_version', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const deleteBudgetBaseline = async (baselineId: string) => {
  const { error } = await supabase
    .from('budget_baselines')
    .delete()
    .eq('id', baselineId);

  if (error) throw error;
};

export const createActivityBudgetAllocation = async (allocation: Omit<ActivityBudgetAllocation, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('activity_budget_allocations')
    .insert([allocation])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getActivityBudgetAllocations = async (activityId: string) => {
  const { data, error } = await supabase
    .from('activity_budget_allocations')
    .select('*')
    .eq('activity_id', activityId);

  if (error) throw error;
  return data || [];
};

export const updateActivityBudgetAllocation = async (id: string, updates: Partial<ActivityBudgetAllocation>) => {
  const { data, error } = await supabase
    .from('activity_budget_allocations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteActivityBudgetAllocation = async (id: string) => {
  const { error } = await supabase
    .from('activity_budget_allocations')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const deleteActualCost = async (costId: string, deletionReason?: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('delete_actual_cost_with_audit', {
    p_cost_id: costId,
    p_user_id: user.user.id,
    p_deletion_reason: deletionReason || null
  });

  if (error) throw error;

  if (data && !data.success) {
    throw new Error(data.error || 'Failed to delete cost');
  }

  return data;
};

export const canUserDeleteCost = async (costId: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  const { data, error } = await supabase.rpc('can_user_delete_cost', {
    p_cost_id: costId,
    p_user_id: user.user.id
  });

  if (error) {
    console.error('Error checking delete permission:', error);
    return false;
  }

  return data === true;
};

export const createActualCost = async (cost: Omit<ActualCost, 'id' | 'created_at' | 'created_by'>) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('actual_costs')
    .insert([{
      ...cost,
      created_by: user.user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getActualCosts = async (projectId: string, filters?: { status?: string; costType?: string; activityId?: string }) => {
  let query = supabase
    .from('actual_costs')
    .select('*')
    .eq('project_id', projectId);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.activityId) {
    query = query.eq('activity_id', filters.activityId);
  }

  if (filters?.costType) {
    query = query.eq('cost_type', filters.costType);
  }

  query = query.order('cost_date', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export const updateActualCost = async (id: string, updates: Partial<ActualCost>) => {
  const { data, error } = await supabase
    .from('actual_costs')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const submitCostForReview = async (id: string) => {
  try {
    console.log('Starting submitCostForReview for cost ID:', id);

    // Get the cost with project info
    const { data: cost, error: costError } = await supabase
      .from('actual_costs')
      .select('*, retrofit_projects!inner(organization_id)')
      .eq('id', id)
      .single();

    if (costError) {
      console.error('Error fetching cost:', costError);
      throw new Error(`Failed to fetch cost: ${costError.message}`);
    }
    if (!cost) {
      throw new Error('Cost not found');
    }

    console.log('Cost data:', cost);

    const organizationId = (cost.retrofit_projects as any).organization_id;
    console.log('Organization ID:', organizationId);

    // Try to find a matching workflow
    const { data: workflowId, error: workflowError } = await supabase
      .rpc('find_matching_cost_review_workflow', {
        p_organization_id: organizationId,
        p_cost_amount: cost.total_amount,
        p_cost_type: cost.cost_type
      });

    if (workflowError) {
      console.error('Workflow lookup error:', workflowError);
      // Don't throw here, just log - no workflow is valid scenario
    }

    console.log('Matched workflow ID:', workflowId);

    // If no workflow found, just update status
    if (!workflowId) {
      console.log('No workflow found, updating status directly');
      const { data: updatedCost, error: updateError } = await supabase
        .from('actual_costs')
        .update({ status: 'pending_review' })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating cost status:', updateError);
        throw new Error(`Failed to update cost status: ${updateError.message}`);
      }
      console.log('Cost status updated successfully');
      return updatedCost;
    }

    // Get current user
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Not authenticated');
    }

    console.log('Creating cost review with workflow');

    // Create cost review
    const { data: review, error: reviewError } = await supabase
      .from('cost_reviews')
      .insert([{
        actual_cost_id: id,
        workflow_id: workflowId,
        submitted_by: user.user.id
      }])
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating cost review:', reviewError);
      throw new Error(`Failed to create cost review: ${reviewError.message}`);
    }

    console.log('Cost review created:', review);

    // Update cost status
    const { data: updatedCost, error: updateError } = await supabase
      .from('actual_costs')
      .update({ status: 'pending_review' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating cost status:', updateError);
      throw new Error(`Failed to update cost status: ${updateError.message}`);
    }

    console.log('Cost submitted for review successfully');
    return updatedCost;
  } catch (error) {
    console.error('submitCostForReview error:', error);
    throw error;
  }
};

export const reviewActualCost = async (id: string, comments?: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: review } = await supabase
    .from('cost_reviews')
    .select('id')
    .eq('actual_cost_id', id)
    .maybeSingle();

  if (review) {
    const { data: result, error: reviewError } = await supabase
      .rpc('process_cost_review_action', {
        p_cost_review_id: review.id,
        p_user_id: user.user.id,
        p_action: 'approved',
        p_comments: comments || null
      });

    if (reviewError) throw reviewError;

    const { data: cost, error: costError } = await supabase
      .from('actual_costs')
      .select()
      .eq('id', id)
      .single();

    if (costError) throw costError;
    return cost;
  }

  const { data, error } = await supabase
    .from('actual_costs')
    .update({
      status: 'reviewed',
      approved_by: user.user.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const rejectActualCost = async (id: string, comments?: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: review } = await supabase
    .from('cost_reviews')
    .select('id')
    .eq('actual_cost_id', id)
    .maybeSingle();

  if (review) {
    const { data: result, error: reviewError } = await supabase
      .rpc('process_cost_review_action', {
        p_cost_review_id: review.id,
        p_user_id: user.user.id,
        p_action: 'rejected',
        p_comments: comments || null
      });

    if (reviewError) throw reviewError;

    const { data: cost, error: costError} = await supabase
      .from('actual_costs')
      .select()
      .eq('id', id)
      .single();

    if (costError) throw costError;
    return cost;
  }

  const { data, error } = await supabase
    .from('actual_costs')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const approveActualCost = reviewActualCost;

export const createLaborCostEntry = async (entry: Omit<LaborCostEntry, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('labor_cost_entries')
    .insert([entry])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getLaborCostEntry = async (actualCostId: string) => {
  const { data, error } = await supabase
    .from('labor_cost_entries')
    .select('*')
    .eq('actual_cost_id', actualCostId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createMaterialCostEntry = async (entry: Omit<MaterialCostEntry, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('material_cost_entries')
    .insert([entry])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getMaterialCostEntry = async (actualCostId: string) => {
  const { data, error } = await supabase
    .from('material_cost_entries')
    .select('*')
    .eq('actual_cost_id', actualCostId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createEquipmentCostEntry = async (entry: Omit<EquipmentCostEntry, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('equipment_cost_entries')
    .insert([entry])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getEquipmentCostEntry = async (actualCostId: string) => {
  const { data, error } = await supabase
    .from('equipment_cost_entries')
    .select('*')
    .eq('actual_cost_id', actualCostId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createSubcontractorCostEntry = async (entry: Omit<SubcontractorCostEntry, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('subcontractor_cost_entries')
    .insert([entry])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getSubcontractorCostEntry = async (actualCostId: string) => {
  const { data, error } = await supabase
    .from('subcontractor_cost_entries')
    .select('*')
    .eq('actual_cost_id', actualCostId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createAssetCostEntry = async (entry: Omit<AssetCostEntry, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('asset_cost_entries')
    .insert([entry])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getAssetCostEntry = async (actualCostId: string) => {
  const { data, error } = await supabase
    .from('asset_cost_entries')
    .select('*')
    .eq('actual_cost_id', actualCostId)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createBudgetChangeOrder = async (changeOrder: Omit<BudgetChangeOrder, 'id' | 'created_at' | 'requested_by' | 'requested_at'>) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const projectChangeOrders = await getBudgetChangeOrders(changeOrder.project_id);
  const nextNumber = projectChangeOrders.length + 1;

  const { data, error } = await supabase
    .from('budget_change_orders')
    .insert([{
      ...changeOrder,
      change_order_number: `CO-${String(nextNumber).padStart(3, '0')}`,
      requested_by: user.user.id,
      requested_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBudgetChangeOrders = async (projectId: string) => {
  const { data, error } = await supabase
    .from('budget_change_orders')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updateBudgetChangeOrder = async (id: string, updates: Partial<BudgetChangeOrder>) => {
  const { data, error } = await supabase
    .from('budget_change_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const reviewBudgetChangeOrder = async (id: string) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('budget_change_orders')
    .update({
      status: 'reviewed',
      reviewed_by: user.user.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const approveBudgetChangeOrder = reviewBudgetChangeOrder;

export const createChangeOrderLineItem = async (lineItem: Omit<ChangeOrderLineItem, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('change_order_line_items')
    .insert([lineItem])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getChangeOrderLineItems = async (changeOrderId: string) => {
  const { data, error } = await supabase
    .from('change_order_line_items')
    .select('*')
    .eq('change_order_id', changeOrderId);

  if (error) throw error;
  return data || [];
};

export const createBudgetRevision = async (revision: Omit<BudgetRevision, 'id' | 'created_at' | 'created_by' | 'revision_number'>) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('budget_revisions')
    .select('revision_number')
    .eq('project_id', revision.project_id)
    .order('revision_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const revisionNumber = existing ? existing.revision_number + 1 : 1;

  const { data, error } = await supabase
    .from('budget_revisions')
    .insert([{
      ...revision,
      revision_number: revisionNumber,
      created_by: user.user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBudgetRevisions = async (projectId: string) => {
  const { data, error } = await supabase
    .from('budget_revisions')
    .select('*')
    .eq('project_id', projectId)
    .order('revision_number', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createCostForecast = async (forecast: Omit<CostForecast, 'id' | 'created_at' | 'created_by'>) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('cost_forecasts')
    .insert([{
      ...forecast,
      created_by: user.user.id
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCostForecasts = async (projectId: string, filters?: { activityId?: string; costType?: string }) => {
  let query = supabase
    .from('cost_forecasts')
    .select('*')
    .eq('project_id', projectId);

  if (filters?.activityId) {
    query = query.eq('activity_id', filters.activityId);
  }

  if (filters?.costType) {
    query = query.eq('cost_type', filters.costType);
  }

  query = query.order('forecast_date', { ascending: false });

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  total_committed: number;
  total_draft: number;
  remaining_budget: number;
  budget_utilization_percent: number;
  by_category: {
    category: string;
    allocated: number;
    spent: number;
    committed: number;
    draft: number;
    remaining: number;
  }[];
  by_activity: {
    activity_id: string;
    activity_name: string;
    allocated: number;
    spent: number;
    committed: number;
    draft: number;
    remaining: number;
  }[];
}

export const getBudgetSummary = async (projectId: string): Promise<BudgetSummary> => {
  const baseline = await getBudgetBaseline(projectId);
  if (!baseline) {
    return {
      total_budget: 0,
      total_spent: 0,
      total_committed: 0,
      total_draft: 0,
      remaining_budget: 0,
      budget_utilization_percent: 0,
      by_category: [],
      by_activity: []
    };
  }

  const allCosts = await getActualCosts(projectId);
  const reviewedCosts = allCosts.filter(c => c.status === 'reviewed');
  const pendingCosts = allCosts.filter(c => c.status === 'pending_review');
  const draftCosts = allCosts.filter(c => c.status === 'draft');

  const total_spent = reviewedCosts.reduce((sum, c) => sum + Number(c.total_amount), 0);
  const total_committed = pendingCosts.reduce((sum, c) => sum + Number(c.total_amount), 0);
  const total_draft = draftCosts.reduce((sum, c) => sum + Number(c.total_amount), 0);
  const remaining_budget = Number(baseline.total_budget) - total_spent - total_committed;
  const budget_utilization_percent = (total_spent / Number(baseline.total_budget)) * 100;

  const by_category = [
    {
      category: 'Assets',
      allocated: Number(baseline.assets_budget),
      spent: reviewedCosts.filter(c => c.cost_type === 'asset').reduce((sum, c) => sum + Number(c.total_amount), 0),
      committed: pendingCosts.filter(c => c.cost_type === 'asset').reduce((sum, c) => sum + Number(c.total_amount), 0),
      draft: draftCosts.filter(c => c.cost_type === 'asset').reduce((sum, c) => sum + Number(c.total_amount), 0),
      remaining: 0
    },
    {
      category: 'Labor',
      allocated: Number(baseline.labor_budget),
      spent: reviewedCosts.filter(c => c.cost_type === 'labor').reduce((sum, c) => sum + Number(c.total_amount), 0),
      committed: pendingCosts.filter(c => c.cost_type === 'labor').reduce((sum, c) => sum + Number(c.total_amount), 0),
      draft: draftCosts.filter(c => c.cost_type === 'labor').reduce((sum, c) => sum + Number(c.total_amount), 0),
      remaining: 0
    },
    {
      category: 'Materials',
      allocated: Number(baseline.materials_budget),
      spent: reviewedCosts.filter(c => c.cost_type === 'material').reduce((sum, c) => sum + Number(c.total_amount), 0),
      committed: pendingCosts.filter(c => c.cost_type === 'material').reduce((sum, c) => sum + Number(c.total_amount), 0),
      draft: draftCosts.filter(c => c.cost_type === 'material').reduce((sum, c) => sum + Number(c.total_amount), 0),
      remaining: 0
    },
    {
      category: 'Equipment',
      allocated: Number(baseline.equipment_budget),
      spent: reviewedCosts.filter(c => c.cost_type === 'equipment').reduce((sum, c) => sum + Number(c.total_amount), 0),
      committed: pendingCosts.filter(c => c.cost_type === 'equipment').reduce((sum, c) => sum + Number(c.total_amount), 0),
      draft: draftCosts.filter(c => c.cost_type === 'equipment').reduce((sum, c) => sum + Number(c.total_amount), 0),
      remaining: 0
    },
    {
      category: 'Subcontractor',
      allocated: Number(baseline.subcontractor_budget),
      spent: reviewedCosts.filter(c => c.cost_type === 'subcontractor').reduce((sum, c) => sum + Number(c.total_amount), 0),
      committed: pendingCosts.filter(c => c.cost_type === 'subcontractor').reduce((sum, c) => sum + Number(c.total_amount), 0),
      draft: draftCosts.filter(c => c.cost_type === 'subcontractor').reduce((sum, c) => sum + Number(c.total_amount), 0),
      remaining: 0
    },
    {
      category: 'Overhead',
      allocated: Number(baseline.overhead_budget),
      spent: reviewedCosts.filter(c => c.cost_type === 'overhead' || c.cost_type === 'other').reduce((sum, c) => sum + Number(c.total_amount), 0),
      committed: pendingCosts.filter(c => c.cost_type === 'overhead' || c.cost_type === 'other').reduce((sum, c) => sum + Number(c.total_amount), 0),
      draft: draftCosts.filter(c => c.cost_type === 'overhead' || c.cost_type === 'other').reduce((sum, c) => sum + Number(c.total_amount), 0),
      remaining: 0
    }
  ];

  by_category.forEach(cat => {
    cat.remaining = cat.allocated - cat.spent - cat.committed;
  });

  return {
    total_budget: Number(baseline.total_budget),
    total_spent,
    total_committed,
    total_draft,
    remaining_budget,
    budget_utilization_percent,
    by_category,
    by_activity: []
  };
};

export const importBudgetFromEstimation = async (projectId: string, estimationData: any) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const totalBudget = estimationData.calculated_value || 0;

  const laborBudget = estimationData.labor_total || 0;
  const materialsBudget = estimationData.materials_total || 0;
  const equipmentBudget = estimationData.equipment_total || 0;
  const subcontractorBudget = estimationData.subcontractor_total || 0;
  const overheadBudget = estimationData.overhead_total || 0;
  const assetsBudget = estimationData.assets_total || 0;

  const contingency = totalBudget * 0.1;

  const baseline = await createBudgetBaseline({
    project_id: projectId,
    total_budget: totalBudget,
    assets_budget: assetsBudget,
    labor_budget: laborBudget,
    materials_budget: materialsBudget,
    equipment_budget: equipmentBudget,
    subcontractor_budget: subcontractorBudget,
    overhead_budget: overheadBudget,
    contingency_budget: contingency,
    imported_from_estimation: true
  });

  return baseline;
};

export interface EVMMetrics {
  planned_value: number;
  earned_value: number;
  actual_cost: number;
  schedule_variance: number;
  cost_variance: number;
  schedule_performance_index: number;
  cost_performance_index: number;
  estimate_at_completion: number;
  estimate_to_complete: number;
  variance_at_completion: number;
  to_complete_performance_index: number;
}

export const calculateEVMMetrics = async (projectId: string): Promise<EVMMetrics> => {
  const { data: project } = await supabase
    .from('retrofit_projects')
    .select('overall_progress')
    .eq('id', projectId)
    .single();

  const baseline = await getBudgetBaseline(projectId);
  const summary = await getBudgetSummary(projectId);

  if (!baseline || !project) {
    return {
      planned_value: 0,
      earned_value: 0,
      actual_cost: 0,
      schedule_variance: 0,
      cost_variance: 0,
      schedule_performance_index: 0,
      cost_performance_index: 0,
      estimate_at_completion: 0,
      estimate_to_complete: 0,
      variance_at_completion: 0,
      to_complete_performance_index: 0
    };
  }

  const planned_value = Number(baseline.total_budget) * (project.overall_progress / 100);
  const earned_value = Number(baseline.total_budget) * (project.overall_progress / 100);
  const actual_cost = summary.total_spent;

  const schedule_variance = earned_value - planned_value;
  const cost_variance = earned_value - actual_cost;
  const schedule_performance_index = planned_value > 0 ? earned_value / planned_value : 0;
  const cost_performance_index = actual_cost > 0 ? earned_value / actual_cost : 0;

  const estimate_at_completion = cost_performance_index > 0
    ? Number(baseline.total_budget) / cost_performance_index
    : Number(baseline.total_budget);

  const estimate_to_complete = estimate_at_completion - actual_cost;
  const variance_at_completion = Number(baseline.total_budget) - estimate_at_completion;

  const work_remaining = Number(baseline.total_budget) - earned_value;
  const funds_remaining = Number(baseline.total_budget) - actual_cost;
  const to_complete_performance_index = funds_remaining > 0 ? work_remaining / funds_remaining : 0;

  return {
    planned_value,
    earned_value,
    actual_cost,
    schedule_variance,
    cost_variance,
    schedule_performance_index,
    cost_performance_index,
    estimate_at_completion,
    estimate_to_complete,
    variance_at_completion,
    to_complete_performance_index
  };
};

export const getCostCategories = async (organizationId: string) => {
  const { data, error } = await supabase
    .from('cost_categories')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('category_name');

  if (error) throw error;
  return data || [];
};

export const createCostCategory = async (category: Omit<CostCategory, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('cost_categories')
    .insert([category])
    .select()
    .single();

  if (error) throw error;
  return data;
};
