import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, CheckCircle, DollarSign, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';

interface CostReviewWorkflow {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  trigger_conditions: {
    min_amount: number;
    cost_types: string[];
  };
  is_active: boolean;
  is_default: boolean;
  created_at: string;
}

interface CostReviewStep {
  id: string;
  workflow_id: string;
  step_order: number;
  reviewer_role_id?: string;
  reviewer_user_id?: string;
  require_all_users: boolean;
  role_name?: string;
  user_email?: string;
}

interface Role {
  id: string;
  name: string;
}

export const CostReviewWorkflowManager: React.FC = () => {
  const { currentOrganization } = useOrganization();
  const [workflows, setWorkflows] = useState<CostReviewWorkflow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editingWorkflow, setEditingWorkflow] = useState<Partial<CostReviewWorkflow> | null>(null);
  const [editingSteps, setEditingSteps] = useState<Partial<CostReviewStep>[]>([]);
  const [isAddingWorkflow, setIsAddingWorkflow] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization) {
      loadWorkflows();
      loadRoles();
    }
  }, [currentOrganization]);

  const loadWorkflows = async () => {
    try {
      const { data, error } = await supabase
        .from('cost_review_workflows')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkflows(data || []);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      if (!currentOrganization) {
        console.log('No organization available for loading roles');
        return;
      }

      console.log('Loading roles for organization:', currentOrganization.id);

      const { data, error } = await supabase
        .from('organization_roles')
        .select('id, role_name')
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading roles:', error);
        throw error;
      }

      console.log('Loaded roles:', data);
      // Map role_name to name for the interface
      const mappedRoles = (data || []).map(role => ({
        id: role.id,
        name: role.role_name
      }));
      setRoles(mappedRoles);
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const loadWorkflowSteps = async (workflowId: string) => {
    try {
      const { data, error } = await supabase
        .from('cost_review_steps')
        .select(`
          *,
          organization_roles(role_name)
        `)
        .eq('workflow_id', workflowId)
        .order('step_order');

      if (error) throw error;

      const { data: orgMembers } = await supabase.rpc('get_organization_members_with_emails', {
        org_id: currentOrganization!.id,
      });

      const emailMap = new Map(
        orgMembers?.map((m: any) => [m.user_id, m.email]) || []
      );

      const steps = (data || []).map(step => ({
        ...step,
        role_name: step.organization_roles?.role_name,
        user_email: step.reviewer_user_id ? emailMap.get(step.reviewer_user_id) : undefined
      }));

      setEditingSteps(steps);
    } catch (error) {
      console.error('Error loading steps:', error);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!editingWorkflow?.name) return;

    try {
      const { data: workflow, error: workflowError } = await supabase
        .from('cost_review_workflows')
        .insert([{
          organization_id: currentOrganization!.id,
          name: editingWorkflow.name,
          description: editingWorkflow.description,
          trigger_conditions: editingWorkflow.trigger_conditions || { min_amount: 0, cost_types: [] },
          is_active: editingWorkflow.is_active ?? true,
          is_default: editingWorkflow.is_default ?? false
        }])
        .select()
        .single();

      if (workflowError) throw workflowError;

      for (const step of editingSteps) {
        await supabase.from('cost_review_steps').insert([{
          workflow_id: workflow.id,
          step_order: step.step_order,
          reviewer_role_id: step.reviewer_role_id,
          reviewer_user_id: step.reviewer_user_id,
          require_all_users: step.require_all_users || false
        }]);
      }

      await loadWorkflows();
      setIsAddingWorkflow(false);
      setEditingWorkflow(null);
      setEditingSteps([]);
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Failed to create workflow');
    }
  };

  const handleUpdateWorkflow = async () => {
    if (!editingWorkflow?.id) return;

    try {
      const { error: workflowError } = await supabase
        .from('cost_review_workflows')
        .update({
          name: editingWorkflow.name,
          description: editingWorkflow.description,
          trigger_conditions: editingWorkflow.trigger_conditions,
          is_active: editingWorkflow.is_active,
          is_default: editingWorkflow.is_default
        })
        .eq('id', editingWorkflow.id);

      if (workflowError) throw workflowError;

      await supabase
        .from('cost_review_steps')
        .delete()
        .eq('workflow_id', editingWorkflow.id);

      for (const step of editingSteps) {
        await supabase.from('cost_review_steps').insert([{
          workflow_id: editingWorkflow.id,
          step_order: step.step_order,
          reviewer_role_id: step.reviewer_role_id,
          reviewer_user_id: step.reviewer_user_id,
          require_all_users: step.require_all_users || false
        }]);
      }

      await loadWorkflows();
      setEditingWorkflow(null);
      setEditingSteps([]);
      setSelectedWorkflow(null);
    } catch (error) {
      console.error('Error updating workflow:', error);
      alert('Failed to update workflow');
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Delete this workflow? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('cost_review_workflows')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await loadWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow');
    }
  };

  const handleEditWorkflow = async (workflow: CostReviewWorkflow) => {
    setEditingWorkflow(workflow);
    await loadWorkflowSteps(workflow.id);
    setSelectedWorkflow(workflow.id);
  };

  const addStep = () => {
    const nextOrder = editingSteps.length + 1;
    setEditingSteps([...editingSteps, { step_order: nextOrder, require_all_users: false }]);
  };

  const removeStep = (index: number) => {
    const newSteps = editingSteps.filter((_, i) => i !== index);
    newSteps.forEach((step, i) => {
      step.step_order = i + 1;
    });
    setEditingSteps(newSteps);
  };

  const updateStep = (index: number, updates: Partial<CostReviewStep>) => {
    const newSteps = [...editingSteps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setEditingSteps(newSteps);
  };

  if (!currentOrganization || loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600">Loading workflows...</p>
        </div>
      </div>
    );
  }

  if (isAddingWorkflow || editingWorkflow) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">
            {isAddingWorkflow ? 'Create Cost Review Workflow' : 'Edit Workflow'}
          </h3>
          <button
            onClick={() => {
              setIsAddingWorkflow(false);
              setEditingWorkflow(null);
              setEditingSteps([]);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Name *
            </label>
            <input
              type="text"
              value={editingWorkflow?.name || ''}
              onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="e.g., High Value Cost Review"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editingWorkflow?.description || ''}
              onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
              placeholder="Describe when this workflow applies..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Amount
              </label>
              <input
                type="number"
                value={editingWorkflow?.trigger_conditions?.min_amount || 0}
                onChange={(e) => setEditingWorkflow({
                  ...editingWorkflow,
                  trigger_conditions: {
                    ...editingWorkflow?.trigger_conditions,
                    min_amount: Number(e.target.value),
                    cost_types: editingWorkflow?.trigger_conditions?.cost_types || []
                  }
                })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Types (comma separated)
              </label>
              <input
                type="text"
                value={editingWorkflow?.trigger_conditions?.cost_types?.join(', ') || ''}
                onChange={(e) => setEditingWorkflow({
                  ...editingWorkflow,
                  trigger_conditions: {
                    min_amount: editingWorkflow?.trigger_conditions?.min_amount || 0,
                    cost_types: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  }
                })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="labor, material, equipment"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingWorkflow?.is_active ?? true}
                onChange={(e) => setEditingWorkflow({ ...editingWorkflow, is_active: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingWorkflow?.is_default ?? false}
                onChange={(e) => setEditingWorkflow({ ...editingWorkflow, is_default: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Default Workflow</span>
            </label>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Review Steps</h4>
            <button
              onClick={addStep}
              className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>

          <div className="space-y-3">
            {editingSteps.map((step, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {step.step_order}
                </div>

                <select
                  value={step.reviewer_role_id || ''}
                  onChange={(e) => updateStep(index, {
                    reviewer_role_id: e.target.value || undefined,
                    reviewer_user_id: undefined
                  })}
                  className="flex-1 px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Role</option>
                  {roles.length === 0 && (
                    <option value="" disabled>No roles available - create roles first</option>
                  )}
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={step.require_all_users || false}
                    onChange={(e) => updateStep(index, { require_all_users: e.target.checked })}
                    className="rounded"
                  />
                  All users
                </label>

                <button
                  onClick={() => removeStep(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {editingSteps.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No review steps defined. Add at least one step.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <button
            onClick={() => {
              setIsAddingWorkflow(false);
              setEditingWorkflow(null);
              setEditingSteps([]);
            }}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={isAddingWorkflow ? handleCreateWorkflow : handleUpdateWorkflow}
            disabled={!editingWorkflow?.name || editingSteps.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isAddingWorkflow ? 'Create Workflow' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Cost Review Workflows</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure approval workflows for cost entries based on amount and type
            </p>
          </div>
          <button
            onClick={() => {
              loadRoles();
              setIsAddingWorkflow(true);
              setEditingWorkflow({ is_active: true, is_default: false });
              setEditingSteps([]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </button>
        </div>
      </div>

      <div className="divide-y">
        {workflows.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows configured</h3>
            <p className="text-gray-600 mb-4">
              Create your first cost review workflow to automate approvals
            </p>
            <button
              onClick={() => {
                loadRoles();
                setIsAddingWorkflow(true);
                setEditingWorkflow({ is_active: true, is_default: false });
                setEditingSteps([]);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Create Workflow
            </button>
          </div>
        ) : (
          workflows.map((workflow) => (
            <div key={workflow.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium text-lg">{workflow.name}</h4>
                    {workflow.is_default && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                        Default
                      </span>
                    )}
                    {workflow.is_active ? (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        Inactive
                      </span>
                    )}
                  </div>

                  {workflow.description && (
                    <p className="text-gray-600 text-sm mb-3">{workflow.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      Min: ${workflow.trigger_conditions.min_amount.toLocaleString()}
                    </div>
                    {workflow.trigger_conditions.cost_types.length > 0 && (
                      <div className="flex items-center gap-1">
                        Types: {workflow.trigger_conditions.cost_types.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditWorkflow(workflow)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
