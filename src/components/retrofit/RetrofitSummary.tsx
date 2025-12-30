import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { RetrofitResults, RetrofitState } from '../../types/retrofit';
import { useOrganization } from '../../contexts/OrganizationContext';
import { formatCurrency as formatCurrencyUtil } from '../../utils/currencyFormatter';

interface RetrofitSummaryProps {
  results: RetrofitResults;
  state: RetrofitState;
  isSidebarCollapsed: boolean;
}

export function RetrofitSummary({ results, state, isSidebarCollapsed }: RetrofitSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { organization } = useOrganization();

  const currency = organization?.currency || 'AED';

  const formatCurrency = (value: number) => {
    return formatCurrencyUtil(value, currency);
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-white border-t-2 border-orange-200 shadow-lg z-30 transition-all duration-300 ${
      isSidebarCollapsed ? 'lg:left-16' : 'lg:left-64'
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex justify-between items-center"
      >
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Estimation Summary</span>
          <span className="text-lg font-bold text-orange-700">{formatCurrency(results.grandTotal)}</span>
        </div>
        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 text-sm border-t border-gray-200 pt-3 max-h-96 overflow-y-auto">
          <div className="flex justify-between">
            <span className="text-gray-600">Project Duration:</span>
            <span className="font-semibold">{results.projectDurationDays} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Manpower Hours:</span>
            <span className="font-semibold">{formatCurrency(results.totalManpowerHours)} hrs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Assets:</span>
            <span className="font-semibold">{formatCurrency(results.totalAssetQuantity)} units</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-600">Manpower Cost:</span>
            <span className="font-semibold">{formatCurrency(results.totalManpowerCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Assets Cost:</span>
            <span className="font-semibold">{formatCurrency(results.totalAssetCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Removal Cost:</span>
            <span className="font-semibold">{formatCurrency(results.totalRemovalCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Materials Cost:</span>
            <span className="font-semibold">{formatCurrency(results.totalMaterialsCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subcontractors:</span>
            <span className="font-semibold">{formatCurrency(results.totalSubcontractorCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Supervision:</span>
            <span className="font-semibold">{formatCurrency(results.totalSupervisionCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Logistics:</span>
            <span className="font-semibold">{formatCurrency(results.totalLogisticsCost)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-700 font-medium">Base Cost:</span>
            <span className="font-bold text-blue-700">{formatCurrency(results.baseCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Overheads ({state.costConfig.overheadsPercent}%):</span>
            <span className="font-semibold text-blue-700">{formatCurrency(results.overheadsCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Performance Bond ({state.costConfig.performanceBondPercent}%):</span>
            <span className="font-semibold">{formatCurrency(results.performanceBondCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Insurance ({state.costConfig.insurancePercent}%):</span>
            <span className="font-semibold">{formatCurrency(results.insuranceCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Warranty ({state.costConfig.warrantyPercent}%):</span>
            <span className="font-semibold">{formatCurrency(results.warrantyCost)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-700 font-medium">Subtotal:</span>
            <span className="font-bold text-gray-700">{formatCurrency(results.subtotalBeforeProfit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Profit ({state.costConfig.profitPercent}%):</span>
            <span className="font-semibold text-blue-700">{formatCurrency(results.profitAmount)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t-2 border-orange-200">
            <span className="text-gray-700 font-medium">Grand Total:</span>
            <span className="font-bold text-orange-700 text-lg">{formatCurrency(results.grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Cost per Asset Unit:</span>
            <span className="font-bold text-orange-700">{formatCurrency(results.costPerAssetUnit)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
