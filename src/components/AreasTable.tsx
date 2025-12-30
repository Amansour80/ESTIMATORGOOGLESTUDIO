import { Plus, Trash2 } from 'lucide-react';
import type { AreaRow, Frequency, Bucket, Machine } from '../types';

interface AreasTableProps {
  areas: AreaRow[];
  machines: Machine[];
  onChange: (areas: AreaRow[]) => void;
}

const FREQUENCIES: Frequency[] = ['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Quarterly', 'Semiannual', 'Annual'];
const BUCKETS: Bucket[] = ['Machine', 'Manual-Detail', 'Manual-General'];

export default function AreasTable({ areas, machines, onChange }: AreasTableProps) {
  const handleAddRow = () => {
    const newRow: AreaRow = {
      id: Date.now().toString(),
      name: 'New Area',
      sqm: 0,
      frequency: 'Daily',
      dailyFrequency: 1,
      bucket: 'Manual-General',
    };
    onChange([...areas, newRow]);
  };

  const handleFrequencyChange = (id: string, newFrequency: Frequency) => {
    onChange(
      areas.map((area) =>
        area.id === id
          ? { ...area, frequency: newFrequency, dailyFrequency: newFrequency === 'Daily' ? (area.dailyFrequency || 1) : undefined }
          : area
      )
    );
  };

  const handleDeleteRow = (id: string) => {
    onChange(areas.filter((area) => area.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof AreaRow, value: any) => {
    onChange(
      areas.map((area) =>
        area.id === id ? { ...area, [field]: value } : area
      )
    );
  };

  const handleBucketChange = (id: string, newBucket: Bucket) => {
    onChange(
      areas.map((area) =>
        area.id === id
          ? { ...area, bucket: newBucket, machineId: newBucket === 'Machine' ? area.machineId : undefined }
          : area
      )
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Areas & Frequencies</h3>
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Row
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-2 py-2 text-left font-medium text-gray-700">Area Name</th>
              <th className="px-2 py-2 text-left font-medium text-gray-700">Total SQM</th>
              <th className="px-2 py-2 text-left font-medium text-gray-700">Frequency</th>
              <th className="px-2 py-2 text-left font-medium text-gray-700">Times/Day</th>
              <th className="px-2 py-2 text-left font-medium text-gray-700">Bucket</th>
              <th className="px-2 py-2 text-left font-medium text-gray-700">Machine</th>
              <th className="px-2 py-2 text-left font-medium text-gray-700 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={area.name}
                    onChange={(e) => handleUpdateRow(area.id, 'name', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={area.sqm}
                    onChange={(e) => handleUpdateRow(area.id, 'sqm', Number(e.target.value))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="px-2 py-2">
                  <select
                    value={area.frequency}
                    onChange={(e) => handleFrequencyChange(area.id, e.target.value as Frequency)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {FREQUENCIES.map((freq) => (
                      <option key={freq} value={freq}>
                        {freq}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  {area.frequency === 'Daily' ? (
                    <input
                      type="number"
                      min="1"
                      value={area.dailyFrequency || 1}
                      onChange={(e) => handleUpdateRow(area.id, 'dailyFrequency', Number(e.target.value))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">N/A</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <select
                    value={area.bucket}
                    onChange={(e) => handleBucketChange(area.id, e.target.value as Bucket)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {BUCKETS.map((bucket) => (
                      <option key={bucket} value={bucket}>
                        {bucket}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  {area.bucket === 'Machine' ? (
                    <select
                      value={area.machineId || ''}
                      onChange={(e) => handleUpdateRow(area.id, 'machineId', e.target.value || undefined)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select machine...</option>
                      {machines.map((machine) => (
                        <option key={machine.id} value={machine.id}>
                          {machine.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-gray-400 text-xs">N/A</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <button
                    onClick={() => handleDeleteRow(area.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
