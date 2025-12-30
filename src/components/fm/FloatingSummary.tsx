import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { FMResults } from '../../types/fm';
import { useOrganization } from '../../contexts/OrganizationContext';
import { formatCurrency as formatCurrencyUtil } from '../../utils/currencyFormatter';

interface FloatingSummaryProps {
  results: FMResults;
  isSidebarCollapsed: boolean;
}

export default function FloatingSummary({ results, isSidebarCollapsed }: FloatingSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { organization } = useOrganization();

  const currency = organization?.currency || 'AED';

  const formatCurrency = (value: number) => {
    return formatCurrencyUtil(value, currency);
  };

  const totalInHouseCost = results.inHouseStack.manpowerAnnual + results.inHouseStack.supervisionAnnual + results.inHouseStack.overtimeAnnual + results.inHouseStack.materialsAnnual + results.inHouseStack.consumablesAnnual;
  const totalSubcontractCost = results.subcontractStack.baseAnnual;
  const totalCost = totalInHouseCost + totalSubcontractCost;
  const sellingPrice = results.grandTotal;
  const monthlySellingPrice = sellingPrice / 12;

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
          <span className="text-lg font-bold text-green-700">{formatCurrency(sellingPrice)}</span>
        </div>
        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2 text-sm border-t border-gray-200 pt-3 max-h-96 overflow-y-auto">
          <div className="flex justify-between">
            <span className="text-gray-600">Total FTE:</span>
            <span className="font-semibold">{results.totalActiveFTE.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Headcount:</span>
            <span className="font-semibold">{results.totalInHouseHeadcount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Supervisors:</span>
            <span className="font-semibold">{results.supervisorsCount}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-600">Manpower Cost:</span>
            <span className="font-semibold">{formatCurrency(results.inHouseStack.manpowerAnnual)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Supervision Cost:</span>
            <span className="font-semibold">{formatCurrency(results.inHouseStack.supervisionAnnual)}</span>
          </div>
          {results.inHouseStack.overtimeAnnual > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Overtime Cost:</span>
              <span className="font-semibold text-orange-600">{formatCurrency(results.inHouseStack.overtimeAnnual)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Materials & Consumables:</span>
            <span className="font-semibold">{formatCurrency(results.inHouseStack.materialsAnnual + results.inHouseStack.consumablesAnnual)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Subcontract:</span>
            <span className="font-semibold">{formatCurrency(results.subcontractStack.baseAnnual)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <span className="text-gray-700 font-medium">Total Cost:</span>
            <span className="font-bold text-blue-700">{formatCurrency(totalCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Overheads + Profit:</span>
            <span className="font-semibold text-blue-700">{formatCurrency(results.inHouseStack.overheads + results.inHouseStack.profit + results.subcontractStack.overheads + results.subcontractStack.profit)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t-2 border-green-200">
            <span className="text-gray-700 font-medium">Annual Selling Price:</span>
            <span className="font-bold text-green-700 text-lg">{formatCurrency(sellingPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700 font-medium">Monthly Selling Price:</span>
            <span className="font-bold text-green-700">{formatCurrency(monthlySellingPrice)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
