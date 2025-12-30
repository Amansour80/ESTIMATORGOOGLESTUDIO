import { useState } from 'react';
import { Settings, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { TechnicianType, DeploymentModel, ContractEstimationMode } from '../../types/fm';

interface Props {
  technicians: TechnicianType[];
  onChange: (technicians: TechnicianType[]) => void;
  contractMode: ContractEstimationMode;
}

export default function TechnicianLibrary({ technicians, onChange, contractMode }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleUpdate = (id: string, field: keyof TechnicianType, value: string | number | DeploymentModel) => {
    onChange(
      technicians.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      )
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-lg">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity pointer-events-auto"
          disabled={false}
        >
          <h2 className="text-xl font-semibold text-gray-800">Technician Library</h2>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        <a
          href="/settings"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
        >
          <Settings className="w-4 h-4" />
          Manage in Settings
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {isExpanded && (
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">Read-only: Loaded from organization settings</p>

      {technicians.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            No technicians found. Please add technicians in Settings → Labor Library.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-medium text-gray-700">Tech Type Name</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Monthly Salary (AED)</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Additional Cost (AED)</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">OT Hours/Month</th>
              {contractMode === 'input_base' && (
                <th className="px-3 py-2 text-left font-medium text-gray-700">Required Count</th>
              )}
              <th className="px-3 py-2 text-left font-medium text-gray-700">Notes</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {technicians.map((tech, index) => (
              <tr key={tech.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2">
                  <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-300">
                    {tech.name}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-300">
                    {tech.monthlySalary.toLocaleString()}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-300">
                    {tech.additionalCost.toLocaleString()}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="px-2 py-1 bg-gray-100 text-gray-700 rounded border border-gray-300">
                    {tech.expectedOvertimeHoursPerMonth}
                  </div>
                </td>
                {contractMode === 'input_base' && (
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={tech.inputBaseCount}
                      onChange={(e) => handleUpdate(tech.id, 'inputBaseCount', Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                      min="0"
                      step="0.1"
                    />
                  </td>
                )}
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={tech.notes}
                    onChange={(e) => handleUpdate(tech.id, 'notes', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                    placeholder="Project notes"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="text-gray-400 text-xs text-center">Read-only</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </div>
      )}
    </div>
  );
}
