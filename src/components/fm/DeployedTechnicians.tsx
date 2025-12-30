import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { DeployedTechnician, TechnicianType } from '../../types/fm';
import { formatCurrency } from '../../utils/currencyFormatter';
import TechnicianSelect from './TechnicianSelect';

interface Props {
  deployedTechnicians: DeployedTechnician[];
  technicianLibrary: TechnicianType[];
  currency: string;
  onChange: (technicians: DeployedTechnician[]) => void;
}

export default function DeployedTechnicians({ deployedTechnicians, technicianLibrary, currency, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const nonSupervisorTechs = technicianLibrary.filter(tech => !tech.canSupervise);

  const handleAdd = () => {
    const newTechnician: DeployedTechnician = {
      id: `deployed-${Date.now()}`,
      technicianTypeId: nonSupervisorTechs[0]?.id || '',
      quantity: 1,
      notes: '',
    };
    onChange([...deployedTechnicians, newTechnician]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this technician deployment?')) {
      onChange(deployedTechnicians.filter((t) => t.id !== id));
    }
  };

  const handleUpdate = (id: string, field: keyof DeployedTechnician, value: string | number) => {
    onChange(
      deployedTechnicians.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      )
    );
  };

  const getTechnicianInfo = (technicianTypeId: string) => {
    const tech = technicianLibrary.find(t => t.id === technicianTypeId);
    if (!tech) return null;
    const totalCompensation = tech.monthlySalary + tech.additionalCost;
    return {
      name: tech.name,
      compensation: formatCurrency(totalCompensation, currency, { decimals: 0, showCode: true })
    };
  };

  if (nonSupervisorTechs.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          No technicians available in the Labor Library. Please add technicians in Settings first.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Deployed Technicians (Input-Base)</h2>
          <p className="text-sm text-gray-600 mt-1">Directly specify the number of each technician type required</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Technician
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

      {isExpanded && (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-medium text-gray-700">Technician Type</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Monthly Cost</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Quantity</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Notes</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deployedTechnicians.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                  No technicians deployed. Click "Add Technician" to start.
                </td>
              </tr>
            ) : (
              deployedTechnicians.map((deployed, index) => {
                const techInfo = getTechnicianInfo(deployed.technicianTypeId);
                return (
                  <tr key={deployed.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 relative z-10">
                      <TechnicianSelect
                        technicians={nonSupervisorTechs}
                        value={deployed.technicianTypeId}
                        onChange={(technicianTypeId) => handleUpdate(deployed.id, 'technicianTypeId', technicianTypeId)}
                        currency={currency}
                        className="bg-yellow-50"
                        placeholder="Select technician..."
                      />
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-gray-700 font-medium">
                        {techInfo?.compensation || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="1"
                        value={deployed.quantity}
                        onChange={(e) => handleUpdate(deployed.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={deployed.notes}
                        onChange={(e) => handleUpdate(deployed.id, 'notes', e.target.value)}
                        placeholder="Optional notes"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleDelete(deployed.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
