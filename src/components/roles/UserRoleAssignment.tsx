import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Search, Mail, User } from 'lucide-react';
import { useOrganization } from '../../contexts/OrganizationContext';
import {
  OrganizationRole,
  UserRoleAssignment as Assignment,
  getUserRoleAssignments,
  assignRoleToUser,
  removeRoleFromUser,
} from '../../utils/rolesDatabase';

interface UserRoleAssignmentProps {
  role: OrganizationRole;
  onClose: () => void;
  onUpdate: () => void;
}

export default function UserRoleAssignment({
  role,
  onClose,
  onUpdate,
}: UserRoleAssignmentProps) {
  const { currentOrganization } = useOrganization();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadAssignments();
      loadMembers();
    }
  }, [role.id, currentOrganization?.id]);

  const loadMembers = async () => {
    try {
      const { getOrganizationMembers } = await import('../../utils/organizationDatabase');
      const result = await getOrganizationMembers(currentOrganization!.id);
      if (result.success && result.data) {
        setMembers(result.data);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const allAssignments = await getUserRoleAssignments(currentOrganization!.id);
      const roleAssignments = allAssignments.filter((a) => a.role_id === role.id);
      setAssignments(roleAssignments);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (userId: string) => {
    try {
      setSubmitting(true);
      await assignRoleToUser(currentOrganization!.id, userId, role.id);
      await loadAssignments();
      setShowAddUser(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to assign role:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign role';
      alert('Failed to assign role: ' + errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveUser = async (assignmentId: string) => {
    if (!confirm('Remove this role from the user?')) return;

    try {
      await removeRoleFromUser(assignmentId);
      await loadAssignments();
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove role');
    }
  };

  const assignedUserIds = new Set(assignments.map((a) => a.user_id));
  const availableUsers = members.filter(
    (m) => !assignedUserIds.has(m.user_id) && m.email
  );

  const getUserDisplayName = (user: Assignment['user']) => {
    if (!user) return 'Unknown User';
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return user.email || 'Unknown User';
  };

  const filteredAssignments = assignments.filter((a) => {
    const email = a.user?.email?.toLowerCase() || '';
    const name = getUserDisplayName(a.user).toLowerCase();
    const query = searchQuery.toLowerCase();
    return email.includes(query) || name.includes(query);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: role.color }}
            />
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{role.role_name}</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Manage user assignments for this role
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              disabled={availableUsers.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="w-5 h-5" />
              Add User
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading users...</div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchQuery ? 'No users found' : 'No users assigned to this role'}
              </p>
              {!searchQuery && availableUsers.length > 0 && (
                <button
                  onClick={() => setShowAddUser(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Add your first user
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {getUserDisplayName(assignment.user)}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{assignment.user?.email}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveUser(assignment.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {assignments.length} user{assignments.length !== 1 ? 's' : ''} assigned
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {showAddUser && (
        <AddUserModal
          role={role}
          availableUsers={availableUsers}
          onAdd={handleAssignUser}
          onClose={() => setShowAddUser(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}

function AddUserModal({
  role,
  availableUsers,
  onAdd,
  onClose,
  submitting,
}: {
  role: OrganizationRole;
  availableUsers: any[];
  onAdd: (userId: string) => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const getUserDisplayName = (user: any) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user.first_name) return user.first_name;
    if (user.last_name) return user.last_name;
    return user.email || 'Unknown User';
  };

  const filteredUsers = availableUsers.filter((user) => {
    const email = user.email?.toLowerCase() || '';
    const name = getUserDisplayName(user).toLowerCase();
    const query = searchQuery.toLowerCase();
    return email.includes(query) || name.includes(query);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
      onAdd(selectedUserId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add User to Role</h3>
          <p className="text-sm text-gray-600 mt-1">
            Select a user to assign the "{role.role_name}" role
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'No users found' : 'No available users'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <label
                  key={user.user_id}
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedUserId === user.user_id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="user"
                    value={user.user_id}
                    checked={selectedUserId === user.user_id}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {getUserDisplayName(user)}
                    </p>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  </div>
                </label>
              ))
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedUserId || submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
