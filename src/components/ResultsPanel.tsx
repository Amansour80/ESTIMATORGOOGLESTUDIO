import { Info } from 'lucide-react';
import type { EstimatorState } from '../types';
import {
  calculateDailyTotalsByBucket,
  calculateMachineDailyTotals,
  calcActiveCleaners,
  calcCoverage,
  calculateMachineryCosts,
  calculateManpowerCosts,
  calculateConsumables,
  calculatePricing,
} from '../utils/calculations';

interface ResultsPanelProps {
  state: EstimatorState;
}

export default function ResultsPanel({ state }: ResultsPanelProps) {
  const dailyTotals = calculateDailyTotalsByBucket(state.areas);
  const machineDailyTotals = calculateMachineDailyTotals(state.areas);
  const activeCleaners = calcActiveCleaners(dailyTotals, state.productivity, machineDailyTotals, state.machines);
  const totalCleanersInclRelievers = calcCoverage(activeCleaners.total, state.site.workingDaysPerYear);

  const machineryCosts = calculateMachineryCosts(activeCleaners.machineCleaners, state.machines);
  const manpowerCosts = calculateManpowerCosts(totalCleanersInclRelievers, state.costs);
  const consumablesCost = calculateConsumables(totalCleanersInclRelievers, state.costs);
  const pricing = calculatePricing(
    manpowerCosts.totalAnnualManpower,
    machineryCosts.totalAnnualMachineryCost,
    consumablesCost,
    state.costs
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(value);
  };

  const formatDecimal = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Results</h2>

      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          Daily-Equivalent SQM by Bucket
          <span title="SQM / Frequency Divisor">
            <Info className="w-4 h-4 text-gray-400" />
          </span>
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Machine SQM/day:</span>
            <span className="font-medium">{formatDecimal(dailyTotals.Machine)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Manual-Detail SQM/day:</span>
            <span className="font-medium">{formatDecimal(dailyTotals['Manual-Detail'])}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Manual-General SQM/day:</span>
            <span className="font-medium">{formatDecimal(dailyTotals['Manual-General'])}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          Active Cleaners
          <span title="Daily SQM / Productivity">
            <Info className="w-4 h-4 text-gray-400" />
          </span>
        </h3>
        <div className="space-y-2 text-sm">
          {state.machines.map((machine) => {
            const cleaners = activeCleaners.machineCleaners.get(machine.id) || 0;
            return (
              <div key={machine.id} className="flex justify-between">
                <span className="text-gray-700">{machine.name}:</span>
                <span className="font-medium">{formatDecimal(cleaners)}</span>
              </div>
            );
          })}
          {state.machines.length > 0 && (
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <span className="text-gray-700">Total Machine cleaners:</span>
              <span className="font-medium">{formatDecimal(activeCleaners.totalMachineCleaners)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-700">Manual-Detail cleaners:</span>
            <span className="font-medium">{formatDecimal(activeCleaners.manualDetail)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Manual-General cleaners:</span>
            <span className="font-medium">{formatDecimal(activeCleaners.manualGeneral)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-800 font-medium">Total Active:</span>
            <span className="font-bold text-blue-600">{formatDecimal(activeCleaners.total)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-800 font-medium">Total incl. Relievers:</span>
            <span className="font-bold text-blue-600">{formatDecimal(totalCleanersInclRelievers)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Machinery</h3>
        <div className="space-y-3 text-sm">
          {machineryCosts.machineDetails.map((detail) => {
            const machine = state.machines.find(m => m.id === detail.machineId);
            const userQuantity = machine?.quantity || 0;
            const requiredQuantity = Math.ceil(detail.cleanersNeeded);
            const isInsufficient = userQuantity < requiredQuantity;
            const isExcessive = userQuantity > requiredQuantity;

            let warningMessage = '';
            if (isInsufficient) {
              warningMessage = ' (The number of machines is less than required)';
            } else if (isExcessive) {
              warningMessage = ' (The number of machines is more than required)';
            }

            return (
              <div key={detail.machineId} className="border-b border-gray-100 pb-2 last:border-0">
                <div className="font-medium text-gray-800 mb-1">{detail.machineName}</div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className="text-gray-600">Cleaners needed:</span>
                  <span className="text-right">{formatDecimal(detail.cleanersNeeded)}</span>
                  <span className="text-gray-600">Quantity:</span>
                  <span className={`text-right ${isInsufficient ? 'font-bold text-red-600' : ''}`}>
                    {detail.quantity}{warningMessage}
                  </span>
                  <span className="text-gray-600">Depreciation:</span>
                  <span className="text-right">{formatCurrency(detail.depreciation)} AED</span>
                  <span className="text-gray-600">Maintenance:</span>
                  <span className="text-right">{formatCurrency(detail.maintenance)} AED</span>
                </div>
              </div>
            );
          })}
          <div className="flex justify-between pt-2 border-t-2 border-gray-200">
            <span className="text-gray-800 font-medium">Total Annual Machinery Cost:</span>
            <span className="font-bold text-green-600">{formatCurrency(machineryCosts.totalAnnualMachineryCost)} AED</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Manpower Cost</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Cleaner Monthly Cost:</span>
            <span className="font-medium">{formatCurrency(manpowerCosts.cleanerMonthlyCost)} AED</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Annual Cleaners Cost:</span>
            <span className="font-medium">{formatCurrency(manpowerCosts.annualCleanersCost)} AED</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Annual Supervisors Cost:</span>
            <span className="font-medium">{formatCurrency(manpowerCosts.annualSupervisorsCost)} AED</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-800 font-medium">Total Annual Manpower:</span>
            <span className="font-bold text-green-600">{formatCurrency(manpowerCosts.totalAnnualManpower)} AED</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Consumables</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-800 font-medium">Annual Consumables:</span>
            <span className="font-bold text-green-600">{formatCurrency(consumablesCost)} AED</span>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-4 shadow-md">
        <h3 className="font-semibold text-gray-800 mb-3">Final Pricing</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Overheads:</span>
            <span className="font-medium">{formatCurrency(pricing.overheads)} AED</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Total Cost:</span>
            <span className="font-medium">{formatCurrency(pricing.totalCost)} AED</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Profit:</span>
            <span className="font-medium">{formatCurrency(pricing.profit)} AED</span>
          </div>
          <div className="flex justify-between pt-2 border-t-2 border-blue-300">
            <span className="text-gray-800 font-bold text-lg">Final Price (Annual):</span>
            <span className="font-bold text-blue-700 text-lg">{formatCurrency(pricing.finalPriceAnnual)} AED</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-800 font-bold">Final Price (Monthly):</span>
            <span className="font-bold text-blue-700">{formatCurrency(pricing.finalPriceMonthly)} AED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
