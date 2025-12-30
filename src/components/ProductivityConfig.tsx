import type { ProductivityConfig as ProductivityConfigType } from '../types';

interface ProductivityConfigProps {
  productivity: ProductivityConfigType;
  onChange: (productivity: ProductivityConfigType) => void;
}

export default function ProductivityConfig({ productivity, onChange }: ProductivityConfigProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">Productivity</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Manual (Detail) sqm/shift</label>
          <input
            type="number"
            value={productivity.manualDetailSqmPerShift}
            onChange={(e) => onChange({ ...productivity, manualDetailSqmPerShift: Number(e.target.value) })}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Manual (General) sqm/shift</label>
          <input
            type="number"
            value={productivity.manualGeneralSqmPerShift}
            onChange={(e) => onChange({ ...productivity, manualGeneralSqmPerShift: Number(e.target.value) })}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
