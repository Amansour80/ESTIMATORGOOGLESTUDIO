import { useState, useEffect } from 'react';
import { Users, Settings, Save, Trash2, Plus, UserPlus, AlertTriangle, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface ProjectSettingsProps {
  projectId: string;
  organizationId: string;
  project: any;
  isReadOnly?: boolean;
}

const PROJECT_ROLES = ['admin', 'manager', 'engineer', 'planner', 'viewer'];

export default function ProjectSettings({ projectId, organizationId, project, isReadOnly = false }: ProjectSettingsProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [orgMembers, setOrgMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState(project.project_name);
  const [clientName, setClientName] = useState(project.client_name || '');
  const [plannedStartDate, setPlannedStartDate] = useState(project.planned_start_date || new Date().toISOString().split('T')[0]);
  const [pmStatus, setPmStatus] = useState(project.pm_status || 'Draft');
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadMembers();
    loadOrgMembers();
    checkSuperAdmin();
  }, [projectId]);

  async function checkSuperAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc('is_super_admin', {
        check_user_id: user.id
      });

      if (error) throw error;
      setIsSuperAdmin(data === true);
    } catch (error) {
      console.error('Error checking super admin:', error);
    }
  }

  async function loadMembers() {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('retrofit_project_id', projectId);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadOrgMembers() {
    try {
      const { data, error } = await supabase.rpc('get_organization_members_with_emails', {
        org_id: organizationId
      });

      if (error) throw error;
      setOrgMembers(data || []);
    } catch (error) {
      console.error('Error loading org members:', error);
    }
  }

  async function handleUpdateProject(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('retrofit_projects')
        .update({
          project_name: projectName,
          client_name: clientName,
          planned_start_date: plannedStartDate,
          pm_status: pmStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;
      alert('Project updated successfully');
      window.location.reload(); // Refresh to show updated status
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project');
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('project_members')
        .insert([{
          retrofit_project_id: projectId,
          organization_id: organizationId,
          user_id: selectedUserId,
          role: selectedRole
        }]);

      if (error) throw error;
      setShowAddMember(false);
      setSelectedUserId('');
      setSelectedRole('viewer');
      loadMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Failed to remove member');
    }
  }

  async function handleUpdateMemberRole(memberId: string, newRole: string) {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      loadMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('Failed to update member role');
    }
  }

  async function handleDeleteProject() {
    try {
      const { error } = await supabase
        .from('retrofit_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      alert('Project deleted successfully');
      window.location.hash = '#/retrofit-pm';
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project');
    }
  }

  function getMemberEmail(userId: string) {
    const member = orgMembers.find(m => m.user_id === userId);
    return member?.email || 'Unknown';
  }

  const availableUsers = orgMembers.filter(
    om => !members.some(m => m.user_id === om.user_id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Project Settings</h2>
        </div>

        <form onSubmit={handleUpdateProject} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client Name
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Planned Start Date
              </div>
            </label>
            <input
              type="date"
              value={plannedStartDate}
              onChange={(e) => setPlannedStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              This date is used as the baseline for activity scheduling. Activities without dependencies will start on this date.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Status
            </label>
            <select
              value={pmStatus}
              onChange={(e) => setPmStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Draft">Draft</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Status auto-updates between Draft/Active/Completed based on activities. Set to "On Hold" or "Cancelled" manually when needed.
            </p>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Project Members</h2>
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <UserPlus className="w-5 h-5" />
            Add Member
          </button>
        </div>

        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{getMemberEmail(member.user_id)}</div>
                <div className="text-sm text-gray-500">
                  Added {new Date(member.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={member.role}
                  onChange={(e) => handleUpdateMemberRole(member.id, e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                >
                  {PROJECT_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isSuperAdmin && (
        <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 mb-1">Danger Zone</h2>
              <p className="text-sm text-red-700">
                Deleting this project will permanently remove all associated data including activities,
                documents, issues, and members. This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 className="w-5 h-5" />
            Delete Project
          </button>
        </div>
      )}

      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Project Member</h3>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select User *
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a user...</option>
                  {availableUsers.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PROJECT_ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Project Deletion</h3>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you absolutely sure you want to delete <span className="font-semibold">{project.project_name}</span>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 font-medium mb-2">This will permanently delete:</p>
                <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
                  <li>All project activities and schedules</li>
                  <li>All documents and their versions</li>
                  <li>All issues and RFIs</li>
                  <li>All project members and permissions</li>
                  <li>All audit logs and history</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                This action cannot be undone!
              </p>
            </div>

            <div className="flex gap-3 p-6 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDeleteProject();
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                Yes, Delete Project
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
