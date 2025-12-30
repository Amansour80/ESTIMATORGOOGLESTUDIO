import { Plus, Trash2 } from 'lucide-react';
import type { Machine } from '../types';

interface MachinesListProps {
  machines: Machine[];
  onChange: (machines: Machine[]) => void;
}

export default function MachinesList({ machines, onChange }: MachinesListProps) {
  const handleAddMachine = () => {
    const newMachine: Machine = {
      id: Date.now().toString(),
      name: 'New Machine',
      quantity: 1,
      cost: 0,
      lifeYears: 5,
      maintenancePercent: 10,
      sqmPerHour: 1000,
      effectiveHoursPerShift: 6,
    };
    onChange([...machines, newMachine]);
  };

  const handleDeleteMachine = (id: string) => {
    onChange(machines.filter((machine) => machine.id !== id));
  };

  const handleUpdateMachine = (id: string, field: keyof Machine, value: any) => {
    onChange(
      machines.map((machine) =>
        machine.id === id ? { ...machine, [field]: value } : machine
      )
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Machines</h3>
        <button
          onClick={handleAddMachine}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Machine
        </button>
      </div>
      <div className="space-y-3">
        {machines.map((machine) => (
          <div key={machine.id} className="border border-gray-200 rounded p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <input
                type="text"
                value={machine.name}
                onChange={(e) => handleUpdateMachine(machine.id, 'name', e.target.value)}
                className="font-medium text-sm px-2 py-1 border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleDeleteMachine(machine.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-gray-600 mb-1">Quantity</label>
                <input
                  type="number"
                  value={machine.quantity}
                  onChange={(e) => handleUpdateMachine(machine.id, 'quantity', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Cost (AED)</label>
                <input
                  type="number"
                  value={machine.cost}
                  onChange={(e) => handleUpdateMachine(machine.id, 'cost', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Life (years)</label>
                <input
                  type="number"
                  value={machine.lifeYears}
                  onChange={(e) => handleUpdateMachine(machine.id, 'lifeYears', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Maintenance %</label>
                <input
                  type="number"
                  value={machine.maintenancePercent}
                  onChange={(e) => handleUpdateMachine(machine.id, 'maintenancePercent', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">SQM/hour</label>
                <input
                  type="number"
                  value={machine.sqmPerHour}
                  onChange={(e) => handleUpdateMachine(machine.id, 'sqmPerHour', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-600 mb-1">Effective hours/shift</label>
                <input
                  type="number"
                  value={machine.effectiveHoursPerShift}
                  onChange={(e) => handleUpdateMachine(machine.id, 'effectiveHoursPerShift', Number(e.target.value))}
                  className="w-full px-2 py-1 border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
