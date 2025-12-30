import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Copy, Star, StarOff, Workflow, AlertCircle, Edit2 } from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  duplicateWorkflow,
  ApprovalWorkflow,
} from '../../utils/workflowDatabase';
import WorkflowCanvas from './WorkflowCanvas';

export default function WorkflowManager() {
  const { currentOrganization } = useOrganization();
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ApprovalWorkflow | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadWorkflows();
    }
  }, [currentOrganization?.id]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkflows(currentOrganization!.id);
      setWorkflows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (name: string, description: string, isDefault: boolean) => {
    try {
      await createWorkflow(currentOrganization!.id, name, description, isDefault);
      await loadWorkflows();
      setShowCreateModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create workflow');
    }
  };

  const handleEdit = async (workflowId: string, name: string, description: string) => {
    try {
      await updateWorkflow(workflowId, { name, description });
      await loadWorkflows();
      setEditingWorkflow(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update workflow');
    }
  };

  const handleDelete = async (workflow: ApprovalWorkflow) => {
    if (workflow.is_default) {
      alert('Cannot delete the default workflow');
      return;
    }

    if (!confirm(`Delete workflow "${workflow.name}"?`)) return;

    try {
      await deleteWorkflow(workflow.id);
      await loadWorkflows();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete workflow');
    }
  };

  const handleDuplicate = async (workflow: ApprovalWorkflow) => {
    const newName = prompt('Enter name for duplicated workflow:', `${workflow.name} (Copy)`);
    if (!newName) return;

    try {
      await duplicateWorkflow(workflow.id, newName);
      await loadWorkflows();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate workflow');
    }
  };

  const handleSetDefault = async (workflow: ApprovalWorkflow) => {
    try {
      await updateWorkflow(workflow.id, { is_default: true });
      await loadWorkflows();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to set default workflow');
    }
  };

  const handleToggleActive = async (workflow: ApprovalWorkflow) => {
    try {
      await updateWorkflow(workflow.id, { is_active: !workflow.is_active });
      await loadWorkflows();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update workflow');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading workflows...</div>
      </div>
    );
  }

  if (showCanvas && selectedWorkflow) {
    return (
      <div className="h-[calc(100vh-200px)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <button
              onClick={() => {
                setShowCanvas(false);
                setSelectedWorkflow(null);
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              ← Back to Workflows
            </button>
            <h3 className="text-xl font-semibold text-gray-900 mt-2">{selectedWorkflow.name}</h3>
            {selectedWorkflow.description && (
              <p className="text-sm text-gray-600 mt-1">{selectedWorkflow.description}</p>
            )}
          </div>
        </div>
        <div className="border border-gray-300 rounded-lg h-[calc(100%-80px)]">
          <WorkflowCanvas
            workflowId={selectedWorkflow.id}
            onSave={loadWorkflows}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Workflow className="w-7 h-7 text-blue-600" />
            Approval Workflows
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Design visual workflows for estimate approvals
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Workflow
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {workflows.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No workflows created yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first workflow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`bg-white border-2 rounded-lg p-5 transition-all ${
                workflow.is_active
                  ? 'border-gray-200 hover:shadow-md'
                  : 'border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{workflow.name}</h3>
                  {workflow.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{workflow.description}</p>
                  )}
                </div>
                {workflow.is_default && (
                  <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 ml-2" fill="currentColor" />
                )}
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    workflow.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {workflow.is_active ? 'Active' : 'Inactive'}
                </span>
                {workflow.is_default && (
                  <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                    Default
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedWorkflow(workflow);
                    setShowCanvas(true);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4 inline mr-1" />
                  Edit Flow
                </button>
                <button
                  onClick={() => setEditingWorkflow(workflow)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Edit name"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDuplicate(workflow)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {!workflow.is_default && (
                  <>
                    <button
                      onClick={() => handleSetDefault(workflow)}
                      className="p-2 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 rounded transition-colors"
                      title="Set as default"
                    >
                      <StarOff className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(workflow)}
                      className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateWorkflowModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreate}
        />
      )}

      {editingWorkflow && (
        <EditWorkflowModal
          workflow={editingWorkflow}
          onClose={() => setEditingWorkflow(null)}
          onSave={handleEdit}
        />
      )}
    </div>
  );
}

function CreateWorkflowModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, description: string, isDefault: boolean) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate(name, description, isDefault);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Create Workflow</h3>
          <p className="text-sm text-gray-600 mt-1">
            Design a new approval workflow for your estimates
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workflow Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Value Projects, Standard Approval"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when this workflow should be used..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Set as default workflow
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-2 ml-6">
              The default workflow is used when no rules match
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditWorkflowModal({
  workflow,
  onClose,
  onSave,
}: {
  workflow: ApprovalWorkflow;
  onClose: () => void;
  onSave: (workflowId: string, name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState(workflow.name);
  const [description, setDescription] = useState(workflow.description || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave(workflow.id, name, description);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Edit Workflow</h3>
          <p className="text-sm text-gray-600 mt-1">
            Update the name and description of this workflow
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workflow Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Value Projects, Standard Approval"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when this workflow should be used..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
