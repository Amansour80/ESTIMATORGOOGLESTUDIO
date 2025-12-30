import type { SiteConfig as SiteConfigType } from '../types';

interface SiteConfigProps {
  site: SiteConfigType;
  onChange: (site: SiteConfigType) => void;
}

export default function SiteConfig({ site, onChange }: SiteConfigProps) {
  const totalLeaveDays = site.annualLeaveDays + site.sickLeaveDays + site.publicHolidayDays + site.weeklyOffDays;
  const effectiveWorkingDays = Math.max(0, 365 - totalLeaveDays);
  const coverageFactor = effectiveWorkingDays > 0 ? site.totalCoverageDaysPerYear / effectiveWorkingDays : 1;

  const handleCoverageDaysChange = (field: string, value: number) => {
    onChange({ ...site, [field]: Math.max(0, value) });
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-800">Site & Coverage</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700 font-medium">Estimation Mode</label>
          <select
            value={site.estimationMode}
            onChange={(e) => onChange({ ...site, estimationMode: e.target.value as 'output_base' | 'input_base' })}
            className="w-36 px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="output_base">Output-Base</option>
            <option value="input_base">Input-Base</option>
          </select>
        </div>

        {site.estimationMode === 'input_base' && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-2 py-2">
            <label className="text-sm text-gray-700 font-medium">Number of Cleaners</label>
            <input
              type="number"
              value={site.inputBaseCleaners || 0}
              onChange={(e) => onChange({ ...site, inputBaseCleaners: Math.max(0, Number(e.target.value)) })}
              className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Total coverage days/year</label>
          <input
            type="number"
            value={site.totalCoverageDaysPerYear}
            onChange={(e) => handleCoverageDaysChange('totalCoverageDaysPerYear', Number(e.target.value))}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Annual leave days</label>
          <input
            type="number"
            value={site.annualLeaveDays}
            onChange={(e) => handleCoverageDaysChange('annualLeaveDays', Number(e.target.value))}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Sick leave days</label>
          <input
            type="number"
            value={site.sickLeaveDays}
            onChange={(e) => handleCoverageDaysChange('sickLeaveDays', Number(e.target.value))}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Public holiday days</label>
          <input
            type="number"
            value={site.publicHolidayDays}
            onChange={(e) => handleCoverageDaysChange('publicHolidayDays', Number(e.target.value))}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Weekly off days</label>
          <input
            type="number"
            value={site.weeklyOffDays}
            onChange={(e) => handleCoverageDaysChange('weeklyOffDays', Number(e.target.value))}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-md px-2 py-1">
          <div className="flex items-center justify-between text-xs text-gray-700">
            <span>Total leave days:</span>
            <span className="font-semibold">{totalLeaveDays}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-700 mt-1">
            <span>Effective working days:</span>
            <span className="font-semibold">{effectiveWorkingDays}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Coverage factor</label>
          <input
            type="text"
            value={coverageFactor.toFixed(3)}
            readOnly
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-gray-100 text-gray-600"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Shift length (hours)</label>
          <input
            type="number"
            step="0.5"
            value={site.shiftLengthHours}
            onChange={(e) => onChange({ ...site, shiftLengthHours: Number(e.target.value) })}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
