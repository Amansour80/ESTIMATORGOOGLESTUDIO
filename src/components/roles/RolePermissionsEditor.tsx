import React from 'react';
import { Eye, Edit, CheckCircle, Workflow, Shield, Info, DollarSign, FileText, CheckSquare, Settings } from 'lucide-react';
import { OrganizationRole } from '../../utils/rolesDatabase';

interface RolePermissionsEditorProps {
  permissions: OrganizationRole['permissions'];
  onChange: (permissions: OrganizationRole['permissions']) => void;
  disabled?: boolean;
}

interface PermissionConfig {
  key: keyof OrganizationRole['permissions'];
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const PERMISSION_CONFIGS: PermissionConfig[] = [
  {
    key: 'can_view',
    label: 'View Projects',
    description: 'Can view project details and estimates',
    icon: <Eye className="w-5 h-5" />,
    color: 'text-blue-600',
  },
  {
    key: 'can_edit',
    label: 'Edit Projects',
    description: 'Can create and modify project estimates',
    icon: <Edit className="w-5 h-5" />,
    color: 'text-green-600',
  },
  {
    key: 'can_approve',
    label: 'Approve Projects',
    description: 'Can approve or reject project estimates in workflows',
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-purple-600',
  },
  {
    key: 'can_manage_workflows',
    label: 'Manage Workflows',
    description: 'Can create and configure approval workflows',
    icon: <Workflow className="w-5 h-5" />,
    color: 'text-orange-600',
  },
  {
    key: 'can_manage_roles',
    label: 'Manage Roles',
    description: 'Can create roles and assign them to users',
    icon: <Shield className="w-5 h-5" />,
    color: 'text-red-600',
  },
  {
    key: 'can_view_budgets',
    label: 'View Budgets',
    description: 'Can view budget information, baselines, and cost summaries',
    icon: <DollarSign className="w-5 h-5" />,
    color: 'text-emerald-600',
  },
  {
    key: 'can_manage_budgets',
    label: 'Manage Budgets',
    description: 'Can create budgets, import from estimates, and manage change orders',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-teal-600',
  },
  {
    key: 'can_review_costs',
    label: 'Review Costs',
    description: 'Can review and approve actual cost entries in workflows',
    icon: <CheckSquare className="w-5 h-5" />,
    color: 'text-indigo-600',
  },
  {
    key: 'can_manage_cost_workflows',
    label: 'Manage Cost Workflows',
    description: 'Can create and configure cost review workflows',
    icon: <Settings className="w-5 h-5" />,
    color: 'text-cyan-600',
  },
];

export default function RolePermissionsEditor({
  permissions,
  onChange,
  disabled = false,
}: RolePermissionsEditorProps) {
  const handleToggle = (key: keyof OrganizationRole['permissions']) => {
    if (disabled) return;
    onChange({
      ...permissions,
      [key]: !permissions[key],
    });
  };

  const handlePreset = (preset: 'none' | 'viewer' | 'editor' | 'approver' | 'admin') => {
    if (disabled) return;

    const presets = {
      none: {
        can_view: false,
        can_edit: false,
        can_approve: false,
        can_manage_workflows: false,
        can_manage_roles: false,
        can_view_budgets: false,
        can_manage_budgets: false,
        can_review_costs: false,
        can_manage_cost_workflows: false,
      },
      viewer: {
        can_view: true,
        can_edit: false,
        can_approve: false,
        can_manage_workflows: false,
        can_manage_roles: false,
        can_view_budgets: true,
        can_manage_budgets: false,
        can_review_costs: false,
        can_manage_cost_workflows: false,
      },
      editor: {
        can_view: true,
        can_edit: true,
        can_approve: false,
        can_manage_workflows: false,
        can_manage_roles: false,
        can_view_budgets: true,
        can_manage_budgets: true,
        can_review_costs: false,
        can_manage_cost_workflows: false,
      },
      approver: {
        can_view: true,
        can_edit: false,
        can_approve: true,
        can_manage_workflows: false,
        can_manage_roles: false,
        can_view_budgets: true,
        can_manage_budgets: false,
        can_review_costs: true,
        can_manage_cost_workflows: false,
      },
      admin: {
        can_view: true,
        can_edit: true,
        can_approve: true,
        can_manage_workflows: true,
        can_manage_roles: true,
        can_view_budgets: true,
        can_manage_budgets: true,
        can_review_costs: true,
        can_manage_cost_workflows: true,
      },
    };

    onChange(presets[preset]);
  };

  const activeCount = Object.values(permissions).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Permissions
          </label>
          <p className="text-sm text-gray-600">
            {activeCount} of {Object.keys(permissions).length} permissions enabled
          </p>
        </div>
        {!disabled && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Quick presets:</span>
            <select
              onChange={(e) => handlePreset(e.target.value as any)}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              defaultValue=""
            >
              <option value="" disabled>
                Select preset
              </option>
              <option value="none">None</option>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="approver">Approver</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          Permissions determine what actions users with this role can perform. Approval and review
          permissions are used in workflow steps for project approvals and cost reviews.
        </p>
      </div>

      <div className="space-y-2">
        {PERMISSION_CONFIGS.map((config) => (
          <label
            key={config.key}
            className={`flex items-start gap-4 p-4 border rounded-lg transition-all ${
              permissions[config.key]
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <input
              type="checkbox"
              checked={permissions[config.key]}
              onChange={() => handleToggle(config.key)}
              disabled={disabled}
              className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={config.color}>{config.icon}</span>
                <span className="font-medium text-gray-900">{config.label}</span>
              </div>
              <p className="text-sm text-gray-600">{config.description}</p>
            </div>
          </label>
        ))}
      </div>

      {Object.values(permissions).every((v) => !v) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            This role has no permissions enabled. Users with this role will have limited
            access to the system.
          </p>
        </div>
      )}
    </div>
  );
}
