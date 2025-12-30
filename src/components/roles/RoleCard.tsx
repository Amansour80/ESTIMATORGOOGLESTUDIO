import React, { useState } from 'react';
import { Edit2, Trash2, Users, Lock, CheckCircle, XCircle, Settings, X } from 'lucide-react';
import { OrganizationRole, deleteCustomRole, getUsersWithRole } from '../../utils/rolesDatabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { ModulePermissionsEditor } from './ModulePermissionsEditor';

interface RoleCardProps {
  role: OrganizationRole;
  onEdit: () => void;
  onAssign: () => void;
  onUpdate: () => void;
}

export default function RoleCard({ role, onEdit, onAssign, onUpdate }: RoleCardProps) {
  const { currentOrganization } = useOrganization();
  const [userCount, setUserCount] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showModulePermissions, setShowModulePermissions] = useState(false);

  React.useEffect(() => {
    if (currentOrganization?.id) {
      loadUserCount();
    }
  }, [currentOrganization?.id, role.id]);

  const loadUserCount = async () => {
    try {
      const users = await getUsersWithRole(currentOrganization!.id, role.id);
      setUserCount(users.length);
    } catch (err) {
      console.error('Failed to load user count:', err);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCustomRole(role.id);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete role');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const permissions = role.permissions;
  const activePermissions = Object.entries(permissions).filter(([_, value]) => value === true);

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: role.color }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{role.role_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                {role.role_type === 'system' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                    <Lock className="w-3 h-3" />
                    System
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Custom
                  </span>
                )}
              </div>
            </div>
          </div>
          {role.role_type === 'custom' && (
            <div className="flex items-center gap-1">
              <button
                onClick={onEdit}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit role"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete role"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {role.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{role.description}</p>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Permissions</span>
            <span className="font-medium text-gray-900">
              {activePermissions.length} / {Object.keys(permissions).length}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {permissions.can_view && (
              <PermissionBadge icon={<CheckCircle />} label="View" active />
            )}
            {permissions.can_edit && (
              <PermissionBadge icon={<CheckCircle />} label="Edit" active />
            )}
            {permissions.can_approve && (
              <PermissionBadge icon={<CheckCircle />} label="Approve" active />
            )}
            {permissions.can_manage_workflows && (
              <PermissionBadge icon={<CheckCircle />} label="Workflows" active />
            )}
            {permissions.can_manage_roles && (
              <PermissionBadge icon={<CheckCircle />} label="Roles" active />
            )}
            {activePermissions.length === 0 && (
              <span className="text-xs text-gray-400">No permissions</span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setShowModulePermissions(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Module Access</span>
          </button>
          <button
            onClick={onAssign}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
          >
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">
              {userCount !== null ? `${userCount} User${userCount !== 1 ? 's' : ''}` : 'Manage Users'}
            </span>
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Role
                </h3>
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete the role "{role.role_name}"?
                  {userCount && userCount > 0 && (
                    <span className="block mt-2 text-red-600 font-medium">
                      This role is currently assigned to {userCount} user{userCount !== 1 ? 's' : ''}.
                      They will lose their approval permissions.
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModulePermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Module Access: {role.role_name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Control which modules users with this role can view and edit
                </p>
              </div>
              <button
                onClick={() => setShowModulePermissions(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <ModulePermissionsEditor roleId={role.id} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PermissionBadge({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
        active
          ? 'bg-green-50 text-green-700'
          : 'bg-gray-50 text-gray-400'
      }`}
    >
      <span className="w-3 h-3">{icon}</span>
      {label}
    </span>
  );
}
