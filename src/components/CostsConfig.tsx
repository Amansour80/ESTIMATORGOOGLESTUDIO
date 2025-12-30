import type { CostsConfig as CostsConfigType } from '../types';

interface CostsConfigProps {
  costs: CostsConfigType;
  onChange: (costs: CostsConfigType) => void;
}

export default function CostsConfig({ costs, onChange }: CostsConfigProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">Costs</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Cleaner salary (AED/month)</label>
          <input
            type="number"
            value={costs.cleanerSalary}
            onChange={(e) => onChange({ ...costs, cleanerSalary: Number(e.target.value) })}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Benefits/allowances (AED/month)</label>
          <input
            type="number"
            value={costs.benefitsAllowances}
            onChange={(e) => onChange({ ...costs, benefitsAllowances: Number(e.target.value) })}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Supervisor salary (AED/month)</label>
          <input
            type="number"
            value={costs.supervisorSalary}
            onChange={(e) => onChange({ ...costs, supervisorSalary: Number(e.target.value) })}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Supervisors count</label>
          <input
            type="number"
            value={costs.supervisorCount}
            onChange={(e) => onChange({ ...costs, supervisorCount: Number(e.target.value) })}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Consumables/cleaner/month (AED)</label>
          <input
            type="number"
            value={costs.consumablesPerCleanerPerMonth}
            onChange={(e) => onChange({ ...costs, consumablesPerCleanerPerMonth: Number(e.target.value) })}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">PPE/cleaner/year (AED)</label>
          <input
            type="number"
            value={costs.ppePerCleanerPerYear}
            onChange={(e) => onChange({ ...costs, ppePerCleanerPerYear: Number(e.target.value) })}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Overheads %</label>
          <input
            type="number"
            value={costs.overheadsPercent}
            onChange={(e) => onChange({ ...costs, overheadsPercent: Number(e.target.value) })}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Profit markup %</label>
          <input
            type="number"
            value={costs.profitMarkupPercent}
            onChange={(e) => onChange({ ...costs, profitMarkupPercent: Number(e.target.value) })}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
