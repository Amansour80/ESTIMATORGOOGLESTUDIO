import { useState, useEffect } from 'react';
import { Plus, AlertCircle, Edit2, Trash2, Save, X, Users, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CommentsSection from './CommentsSection';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { getIssueStatusColor, getIssuePriorityColor } from '../../utils/statusColors';

interface Issue {
  id: string;
  title: string;
  description: string;
  issue_type: string;
  priority: string;
  status: string;
  reported_by: string;
  assigned_to_user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface IssueFormData {
  title: string;
  description: string;
  issue_type: string;
  priority: string;
  status: string;
  assigned_to_user_id: string;
}

interface IssuesManagerProps {
  projectId: string;
  organizationId: string;
  isReadOnly?: boolean;
}


const ISSUE_TYPES = [
  'RFI',
  'Defect',
  'Change Request',
  'Safety',
  'Quality',
  'Other'
];

const PRIORITIES = [
  'Critical',
  'High',
  'Medium',
  'Low'
];

const ISSUE_STATUSES = [
  'Open',
  'In Progress',
  'Pending Response',
  'Resolved',
  'Closed'
];

export default function IssuesManager({ projectId, organizationId }: IssuesManagerProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const { members: projectMembers } = useProjectMembers(projectId, organizationId);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);
  const [formData, setFormData] = useState<IssueFormData>({
    title: '',
    description: '',
    issue_type: 'RFI',
    priority: 'Medium',
    status: 'Open',
    assigned_to_user_id: ''
  });

  useEffect(() => {
    loadIssues();
  }, [projectId]);

  async function loadIssues() {
    try {
      const { data, error } = await supabase
        .from('project_issues')
        .select('*')
        .eq('retrofit_project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setLoading(false);
    }
  }


  function openAddForm() {
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      issue_type: 'RFI',
      priority: 'Medium',
      status: 'Open',
      assigned_to_user_id: ''
    });
    setShowForm(true);
  }

  function openEditForm(issue: Issue) {
    setEditingId(issue.id);
    setFormData({
      title: issue.title,
      description: issue.description,
      issue_type: issue.issue_type,
      priority: issue.priority,
      status: issue.status,
      assigned_to_user_id: issue.assigned_to_user_id || ''
    });
    setShowForm(true);
  }

  function getAssigneeName(issue: Issue): string {
    if (!issue.assigned_to_user_id) return 'Unassigned';
    const member = projectMembers.find(m => m.user_id === issue.assigned_to_user_id);
    return member?.email || 'Unknown';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingId) {
        const updateData = {
          title: formData.title,
          description: formData.description,
          issue_type: formData.issue_type,
          priority: formData.priority,
          status: formData.status,
          assigned_to_user_id: formData.assigned_to_user_id || null,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('project_issues')
          .update(updateData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const insertData = {
          title: formData.title,
          description: formData.description,
          issue_type: formData.issue_type,
          priority: formData.priority,
          status: formData.status,
          assigned_to_user_id: formData.assigned_to_user_id || null,
          retrofit_project_id: projectId,
          organization_id: organizationId,
          reported_by: user.id,
          created_by: user.id
        };

        const { error } = await supabase
          .from('project_issues')
          .insert([insertData]);

        if (error) throw error;
      }

      setShowForm(false);
      loadIssues();
    } catch (error) {
      console.error('Error saving issue:', error);
      alert('Failed to save issue. Please try again.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this issue?')) return;

    try {
      const { error } = await supabase
        .from('project_issues')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadIssues();
    } catch (error) {
      console.error('Error deleting issue:', error);
      alert('Failed to delete issue. Please try again.');
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading issues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Issues & RFIs</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track issues, RFIs, and other project concerns
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Issue
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No issues yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first issue to start tracking project concerns
          </p>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add First Issue
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getIssuePriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getIssueStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                    <span className="text-xs text-gray-500">{issue.issue_type}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{issue.title}</h3>
                  <p className="text-gray-600">{issue.description}</p>
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>Assigned to: <span className="font-medium">{getAssigneeName(issue)}</span></span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setViewingIssue(issue)}
                    className="text-gray-600 hover:text-blue-900"
                    title="View details and comments"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditForm(issue)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(issue.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200">
                <span>Created {new Date(issue.created_at).toLocaleDateString()}</span>
                <span>Updated {new Date(issue.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Issue' : 'Add New Issue'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief summary of the issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detailed description of the issue..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.issue_type}
                    onChange={(e) => setFormData({ ...formData, issue_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ISSUE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {PRIORITIES.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {ISSUE_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Assign To
                  </div>
                </label>
                <select
                  value={formData.assigned_to_user_id}
                  onChange={(e) => setFormData({ ...formData, assigned_to_user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {projectMembers.map(member => (
                    <option key={member.id} value={member.user_id}>
                      {member.email || member.user_id} ({member.role})
                    </option>
                  ))}
                </select>
                {projectMembers.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    No project members yet. Add members in Settings tab.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update Issue' : 'Create Issue'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getIssuePriorityColor(viewingIssue.priority)}`}>
                    {viewingIssue.priority}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getIssueStatusColor(viewingIssue.status)}`}>
                    {viewingIssue.status}
                  </span>
                  <span className="text-xs text-gray-500">{viewingIssue.issue_type}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{viewingIssue.title}</h3>
              </div>
              <button
                onClick={() => setViewingIssue(null)}
                className="text-gray-400 hover:text-gray-600 ml-4"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-900">{viewingIssue.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Assignment</h4>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{getAssigneeName(viewingIssue)}</span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 text-gray-900">{new Date(viewingIssue.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="ml-2 text-gray-900">{new Date(viewingIssue.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <CommentsSection
                  entityType="issue"
                  entityId={viewingIssue.id}
                  organizationId={organizationId}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
