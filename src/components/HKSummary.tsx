import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
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
  calculateWorkingDaysPerYear,
  calculateCoverageFactor,
  calculateRelievers,
} from '../utils/calculations';
import { useOrganization } from '../contexts/OrganizationContext';
import { formatCurrency as formatCurrencyUtil } from '../utils/currencyFormatter';

interface HKSummaryProps {
  state: EstimatorState;
  isSidebarCollapsed: boolean;
}

export default function HKSummary({ state, isSidebarCollapsed }: HKSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { organization } = useOrganization();

  const workingDaysPerYear = calculateWorkingDaysPerYear(
    state.site.annualLeaveDays,
    state.site.sickLeaveDays,
    state.site.publicHolidayDays,
    state.site.weeklyOffDays
  );

  const coverageFactor = state.site.totalCoverageDaysPerYear / workingDaysPerYear;

  const dailyTotals = calculateDailyTotalsByBucket(state.areas);
  const machineDailyTotals = calculateMachineDailyTotals(state.areas);

  let activeCleanersTotal: number;
  let relieversCount: number;

  if (state.site.estimationMode === 'input_base') {
    activeCleanersTotal = state.site.inputBaseCleaners || 0;
    relieversCount = calculateRelievers(activeCleanersTotal, coverageFactor);
  } else {
    const activeCleaners = calcActiveCleaners(dailyTotals, state.productivity, machineDailyTotals, state.machines);
    activeCleanersTotal = activeCleaners.total;
    relieversCount = calculateRelievers(activeCleanersTotal, coverageFactor);
  }

  const totalCleanersInclRelievers = activeCleanersTotal + relieversCount;

  const activeCleaners = calcActiveCleaners(dailyTotals, state.productivity, machineDailyTotals, state.machines);
  const machineryCosts = calculateMachineryCosts(activeCleaners.machineCleaners, state.machines);
  const manpowerCosts = calculateManpowerCosts(totalCleanersInclRelievers, state.costs);
  const consumablesCost = calculateConsumables(totalCleanersInclRelievers, state.costs);
  const pricing = calculatePricing(
    manpowerCosts.totalAnnualManpower,
    machineryCosts.totalAnnualMachineryCost,
    consumablesCost,
    state.costs
  );

  const currency = organization?.currency || 'AED';

  const formatCurrency = (value: number) => {
    return formatCurrencyUtil(value, currency);
  };

  const formatDecimal = (value: number, decimals = 2) => {
    return value.toFixed(decimals);
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-200 shadow-lg z-30 transition-all duration-300 ${
      isSidebarCollapsed ? 'lg:left-16' : 'lg:left-64'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex justify-between items-center"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Estimation Summary</span>
          <span className="text-lg font-bold text-green-700">{formatCurrency(pricing.finalPriceAnnual)}</span>
        </div>
        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 text-sm border-t border-gray-200 pt-3 max-h-96 overflow-y-auto">
          <div className="flex justify-between">
            <span className="text-gray-600">Active Cleaners:</span>
            <span className="font-semibold">{formatDecimal(activeCleanersTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Relievers:</span>
            <span className="font-semibold">{formatDecimal(relieversCount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Cleaners (with Relievers):</span>
            <span className="font-semibold">{formatDecimal(totalCleanersInclRelievers)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-600">Manpower Cost:</span>
            <span className="font-semibold">{formatCurrency(manpowerCosts.totalAnnualManpower)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Machinery Cost:</span>
            <span className="font-semibold">{formatCurrency(machineryCosts.totalAnnualMachineryCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Consumables:</span>
            <span className="font-semibold">{formatCurrency(consumablesCost)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-700 font-medium">Total Cost:</span>
            <span className="font-bold text-blue-700">{formatCurrency(pricing.totalCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Overheads ({state.costs.overheadsPercent}%):</span>
            <span className="font-semibold text-blue-700">{formatCurrency(pricing.overheads)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Profit ({state.costs.profitMarkupPercent}%):</span>
            <span className="font-semibold text-blue-700">{formatCurrency(pricing.profit)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t-2 border-green-200">
            <span className="text-gray-700 font-medium">Annual Selling Price:</span>
            <span className="font-bold text-green-700 text-lg">{formatCurrency(pricing.finalPriceAnnual)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Monthly Selling Price:</span>
            <span className="font-bold text-green-700">{formatCurrency(pricing.finalPriceMonthly)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
