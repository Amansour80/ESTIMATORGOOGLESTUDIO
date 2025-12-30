import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { GlobalAssumptions, ContractEstimationMode } from '../../types/fm';

interface Props {
  assumptions: GlobalAssumptions;
  onChange: (assumptions: GlobalAssumptions) => void;
}

export default function GlobalAssumptionsComponent({ assumptions, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCoverageDaysChange = (field: string, value: number) => {
    const newAssumptions = { ...assumptions, [field]: Math.max(0, value) };
    const totalLeaveDays = newAssumptions.annualLeaveDays + newAssumptions.sickLeaveDays + newAssumptions.publicHolidayDays + newAssumptions.weeklyOffDays;
    const effectiveWorkingDays = 365 - totalLeaveDays;

    onChange({
      ...newAssumptions,
      coverageFactor: effectiveWorkingDays > 0 ? newAssumptions.totalCoverageDaysPerYear / effectiveWorkingDays : 1,
    });
  };

  const handleShiftChange = (value: number) => {
    const shiftLength = Math.max(1, Math.min(24, value));
    const totalNonWorkMinutes = assumptions.breakMinutes + assumptions.transportationMinutes;
    onChange({
      ...assumptions,
      shiftLength,
      effectiveHours: shiftLength - totalNonWorkMinutes / 60,
    });
  };

  const handleBreakChange = (value: number) => {
    const breakMinutes = Math.max(0, value);
    const totalNonWorkMinutes = breakMinutes + assumptions.transportationMinutes;
    onChange({
      ...assumptions,
      breakMinutes,
      effectiveHours: assumptions.shiftLength - totalNonWorkMinutes / 60,
    });
  };

  const handleTransportationChange = (value: number) => {
    const transportationMinutes = Math.max(0, value);
    const totalNonWorkMinutes = assumptions.breakMinutes + transportationMinutes;
    onChange({
      ...assumptions,
      transportationMinutes,
      effectiveHours: assumptions.shiftLength - totalNonWorkMinutes / 60,
    });
  };

  const handleContractModeChange = (value: ContractEstimationMode) => {
    onChange({
      ...assumptions,
      contractMode: value,
    });
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg pointer-events-auto"
        disabled={false}
      >
        <h2 className="text-xl font-semibold text-gray-800">Project Specific Assumptions</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contract Estimation Mode
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleContractModeChange('output_base')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                assumptions.contractMode === 'output_base'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Output Base
            </button>
            <button
              onClick={() => handleContractModeChange('input_base')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                assumptions.contractMode === 'input_base'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Input Base
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {assumptions.contractMode === 'output_base'
              ? 'Calculate technician needs based on asset inventory and PPM/Reactive tasks'
              : 'Directly input required technician count based on client requirements'}
          </p>
        </div>

        {assumptions.contractMode === 'input_base' && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Asset Library Configuration</h3>
            <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="useAssetLibrary"
                checked={assumptions.useAssetLibrary}
                onChange={(e) => onChange({ ...assumptions, useAssetLibrary: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="useAssetLibrary" className="flex-1">
                <span className="text-sm font-semibold text-gray-800 block">
                  Include Asset Library for Material Estimation
                </span>
                <span className="text-xs text-gray-600">
                  Enable if you need to estimate materials based on asset inventory
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Industry Standard Library</h3>
          <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
            <input
              type="checkbox"
              id="useIndustryStandard"
              checked={assumptions.useIndustryStandard}
              onChange={(e) => onChange({ ...assumptions, useIndustryStandard: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="useIndustryStandard" className="text-sm font-medium text-gray-800 cursor-pointer">
              Use Industry Standard PPM Library
            </label>
          </div>
          <p className="text-xs text-gray-600 mt-2 ml-1">
            {assumptions.useIndustryStandard
              ? '✓ Industry Standard Library enabled: Import assets with standard PPM tasks and frequencies'
              : 'When enabled, import assets with industry-standard maintenance specifications'}
          </p>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Coverage Days Configuration</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Coverage Days Required per Year
              </label>
              <input
                type="number"
                value={assumptions.totalCoverageDaysPerYear}
                onChange={(e) => handleCoverageDaysChange('totalCoverageDaysPerYear', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="365"
              />
              <p className="text-xs text-gray-500 mt-1">
                Total days the facility needs coverage (e.g., 365 for 7 days/week, 313 for 6 days/week)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Leave Days
                </label>
                <input
                  type="number"
                  value={assumptions.annualLeaveDays}
                  onChange={(e) => handleCoverageDaysChange('annualLeaveDays', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="365"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sick Leave Days
                </label>
                <input
                  type="number"
                  value={assumptions.sickLeaveDays}
                  onChange={(e) => handleCoverageDaysChange('sickLeaveDays', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="365"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public Holiday Days
                </label>
                <input
                  type="number"
                  value={assumptions.publicHolidayDays}
                  onChange={(e) => handleCoverageDaysChange('publicHolidayDays', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="365"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekly Off Days
                </label>
                <input
                  type="number"
                  value={assumptions.weeklyOffDays}
                  onChange={(e) => handleCoverageDaysChange('weeklyOffDays', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  max="365"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="text-sm text-gray-700">
                <div className="flex justify-between mb-1">
                  <span>Total Leave Days:</span>
                  <span className="font-semibold">
                    {assumptions.annualLeaveDays + assumptions.sickLeaveDays + assumptions.publicHolidayDays + assumptions.weeklyOffDays} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Effective Working Days:</span>
                  <span className="font-semibold">
                    {Math.max(0, 365 - (assumptions.annualLeaveDays + assumptions.sickLeaveDays + assumptions.publicHolidayDays + assumptions.weeklyOffDays))} days
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coverage Factor (Read-only)
              </label>
              <input
                type="text"
                value={assumptions.coverageFactor.toFixed(3)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Multiplier to account for coverage requirements vs. actual working days
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Shift Configuration</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift Length (hours)
              </label>
              <input
                type="number"
                step="0.5"
                value={assumptions.shiftLength}
                onChange={(e) => handleShiftChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="24"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transportation Time Loss (minutes)
              </label>
              <input
                type="number"
                value={assumptions.transportationMinutes}
                onChange={(e) => handleTransportationChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="480"
              />
              <p className="text-xs text-gray-500 mt-1">
                Time spent traveling between sites (applies to rotating technicians)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Break Minutes
              </label>
              <input
                type="number"
                value={assumptions.breakMinutes}
                onChange={(e) => handleBreakChange(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                max="480"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Effective Hours (Read-only)
              </label>
              <input
                type="text"
                value={assumptions.effectiveHours.toFixed(2)}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
            </div>
          </div>
        </div>

        </div>
      )}
    </div>
  );
}
