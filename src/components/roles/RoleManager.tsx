import React, { useState, useEffect } from 'react';
import { Plus, Search, Shield, AlertCircle } from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import {
  getOrganizationRoles,
  createCustomRole,
  OrganizationRole,
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLE_COLORS,
} from '../../utils/rolesDatabase';
import RoleCard from './RoleCard';
import RolePermissionsEditor from './RolePermissionsEditor';
import UserRoleAssignment from './UserRoleAssignment';

export default function RoleManager() {
  const { currentOrganization } = useOrganization();
  const [roles, setRoles] = useState<OrganizationRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<OrganizationRole | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadRoles();
    }
  }, [currentOrganization?.id]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrganizationRoles(currentOrganization!.id);
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (roleData: {
    name: string;
    description: string;
    color: string;
    permissions: OrganizationRole['permissions'];
  }) => {
    try {
      await createCustomRole(
        currentOrganization!.id,
        roleData.name,
        roleData.description,
        roleData.color,
        roleData.permissions
      );
      await loadRoles();
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    }
  };

  const filteredRoles = roles.filter((role) =>
    role.role_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const systemRoles = filteredRoles.filter((r) => r.role_type === 'system');
  const customRoles = filteredRoles.filter((r) => r.role_type === 'custom');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading roles...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-blue-600" />
            Roles & Permissions
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage approval roles and assign them to team members
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Custom Role
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

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search roles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Roles</h3>
          <p className="text-sm text-gray-600 mb-4">
            Default roles provided by the system. These cannot be edited or deleted.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemRoles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={() => setSelectedRole(role)}
                onAssign={() => {
                  setSelectedRole(role);
                  setShowAssignmentModal(true);
                }}
                onUpdate={loadRoles}
              />
            ))}
          </div>
        </div>

        {customRoles.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Roles</h3>
            <p className="text-sm text-gray-600 mb-4">
              Organization-specific roles for your approval workflows.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customRoles.map((role) => (
                <RoleCard
                  key={role.id}
                  role={role}
                  onEdit={() => setSelectedRole(role)}
                  onAssign={() => {
                    setSelectedRole(role);
                    setShowAssignmentModal(true);
                  }}
                  onUpdate={loadRoles}
                />
              ))}
            </div>
          </div>
        )}

        {filteredRoles.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No roles found</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateRoleModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRole}
        />
      )}

      {selectedRole && !showAssignmentModal && (
        <EditRoleModal
          role={selectedRole}
          onClose={() => setSelectedRole(null)}
          onUpdate={loadRoles}
        />
      )}

      {selectedRole && showAssignmentModal && (
        <UserRoleAssignment
          role={selectedRole}
          onClose={() => {
            setSelectedRole(null);
            setShowAssignmentModal(false);
          }}
          onUpdate={loadRoles}
        />
      )}
    </div>
  );
}

function CreateRoleModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(DEFAULT_ROLE_COLORS.cost_controller);
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreate({ name, description, color, permissions });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Create Custom Role</h3>
          <p className="text-sm text-gray-600 mt-1">
            Define a new role for your approval workflows
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Cost Controller, CFO, Technical Lead"
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
              placeholder="Describe the role's responsibilities..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#3B82F6"
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>

          <RolePermissionsEditor
            permissions={permissions}
            onChange={setPermissions}
          />

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
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
              {submitting ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditRoleModal({
  role,
  onClose,
  onUpdate,
}: {
  role: OrganizationRole;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [name, setName] = useState(role.role_name);
  const [description, setDescription] = useState(role.description || '');
  const [color, setColor] = useState(role.color);
  const [permissions, setPermissions] = useState(role.permissions);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { updateCustomRole } = await import('../../utils/rolesDatabase');
      await updateCustomRole(role.id, {
        role_name: name,
        description,
        color,
        permissions,
      });
      onUpdate();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (role.role_type === 'system') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">System Role</h3>
          <p className="text-gray-600 mb-6">
            System roles cannot be edited. They are predefined by the system.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Edit Role</h3>
          <p className="text-sm text-gray-600 mt-1">
            Modify role details and permissions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 rounded cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>

          <RolePermissionsEditor
            permissions={permissions}
            onChange={setPermissions}
          />

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
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
