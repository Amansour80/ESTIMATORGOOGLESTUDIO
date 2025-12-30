import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { MaterialItem } from '../../types/fm';

interface Props {
  materials: MaterialItem[];
  onChange: (materials: MaterialItem[]) => void;
}

export default function MaterialsCatalog({ materials, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const handleAdd = () => {
    const newMaterial: MaterialItem = {
      id: `mat-${Date.now()}`,
      category: 'HVAC',
      item: 'New Item',
      unit: 'pcs',
      unitRate: 0,
      expectedAnnualQty: 0,
      included: true,
    };
    onChange([...materials, newMaterial]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this material?')) {
      onChange(materials.filter((m) => m.id !== id));
    }
  };

  const handleUpdate = (id: string, field: keyof MaterialItem, value: string | number | boolean) => {
    onChange(
      materials.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      )
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-1 flex items-center justify-between pointer-events-auto"
          disabled={false}
        >
          <h2 className="text-xl font-semibold text-gray-800">Materials Catalog</h2>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4">
          <div className="flex justify-end mb-4">
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-medium text-gray-700">Category</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Item</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Unit</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Unit Rate (AED)</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Expected Annual Qty</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Included?</th>
              <th className="px-3 py-2 text-left font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material, index) => (
              <tr key={material.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={material.category}
                    onChange={(e) => handleUpdate(material.id, 'category', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={material.item}
                    onChange={(e) => handleUpdate(material.id, 'item', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={material.unit}
                    onChange={(e) => handleUpdate(material.id, 'unit', e.target.value)}
                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={material.unitRate}
                    onChange={(e) => handleUpdate(material.id, 'unitRate', Number(e.target.value))}
                    className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                    min="0"
                    step="0.01"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={material.expectedAnnualQty}
                    onChange={(e) => handleUpdate(material.id, 'expectedAnnualQty', Number(e.target.value))}
                    className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-yellow-50"
                    min="0"
                    step="0.1"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={material.included}
                    onChange={(e) => handleUpdate(material.id, 'included', e.target.checked)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleDelete(material.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>

          {materials.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No materials defined. Click "Add" to create one.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
