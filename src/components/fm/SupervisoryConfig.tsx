import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { SupervisoryConfig, TechnicianType, SupportRole, DeploymentModel } from '../../types/fm';

interface Props {
  config: SupervisoryConfig;
  technicians: TechnicianType[];
  onChange: (config: SupervisoryConfig) => void;
}

export default function SupervisoryConfigComponent({ config, technicians, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const supervisoryTechnicians = technicians.filter(tech => tech.canSupervise);

  const handleAddRole = () => {
    const newRole: SupportRole = {
      id: `support-${Date.now()}`,
      technicianTypeId: supervisoryTechnicians[0]?.id || '',
      count: 1,
      deploymentModel: 'resident',
    };
    onChange({
      supportRoles: [...config.supportRoles, newRole],
    });
  };

  const handleDeleteRole = (id: string) => {
    onChange({
      supportRoles: config.supportRoles.filter((r) => r.id !== id),
    });
  };

  const handleUpdateRole = (id: string, updates: Partial<SupportRole>) => {
    onChange({
      supportRoles: config.supportRoles.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Support & Supervision</h2>
          <p className="text-sm text-gray-600">Add supervisors, managers, engineers, or other support roles</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRole}
            disabled={supervisoryTechnicians.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Support Role
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors pointer-events-auto"
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && supervisoryTechnicians.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            No technicians are marked as supervisory-capable. Please go to Settings → Labor Library and mark appropriate roles (managers, supervisors, engineers) with "Can Supervise".
          </p>
        </div>
      )}

      {isExpanded && (
      <div className="space-y-3">
        {config.supportRoles.map((role) => (
          <div key={role.id} className="border border-gray-300 rounded-lg p-4 bg-white">
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Type
                </label>
                <select
                  value={role.technicianTypeId}
                  onChange={(e) => handleUpdateRole(role.id, { technicianTypeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                  disabled={supervisoryTechnicians.length === 0}
                >
                  {supervisoryTechnicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Count
                </label>
                <input
                  type="number"
                  value={role.count}
                  onChange={(e) => handleUpdateRole(role.id, { count: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                  min="0"
                  step="0.1"
                />
              </div>

              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deployment
                </label>
                <select
                  value={role.deploymentModel}
                  onChange={(e) => handleUpdateRole(role.id, { deploymentModel: e.target.value as DeploymentModel })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                >
                  <option value="resident">🏠 Resident</option>
                  <option value="rotating">🔄 Rotating</option>
                </select>
              </div>

              <div className="col-span-3 flex justify-end">
                <button
                  onClick={() => handleDeleteRole(role.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {isExpanded && config.supportRoles.length === 0 && supervisoryTechnicians.length > 0 && (
        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
          No support roles defined. Click "Add Support Role" to add supervisors, managers, or engineers.
        </div>
      )}
    </div>
  );
}
