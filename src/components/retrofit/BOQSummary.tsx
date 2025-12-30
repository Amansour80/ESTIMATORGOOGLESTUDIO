import React from 'react';
import { BOQSummary as BOQSummaryType } from '../../types/boq';

interface BOQSummaryProps {
  summary: BOQSummaryType;
  currency: string;
}

export function BOQSummary({ summary, currency }: BOQSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2
    }).format(value).replace('AED', currency);
  };

  const sortedCategories = Object.entries(summary.categoryBreakdown)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">BOQ Summary</h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700 font-medium">Total Material Cost:</span>
            <span className="text-gray-900 font-semibold">{formatCurrency(summary.totalMaterialCost)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700 font-medium">Total Labor Cost:</span>
            <span className="text-gray-900 font-semibold">{formatCurrency(summary.totalLaborCost)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700 font-medium">Total Supervision Cost:</span>
            <span className="text-gray-900 font-semibold">{formatCurrency(summary.totalSupervisionCost)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700 font-medium">Total Direct Costs:</span>
            <span className="text-gray-900 font-semibold">{formatCurrency(summary.totalDirectCost)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700 font-medium">Total Subcontractor Costs:</span>
            <span className="text-gray-900 font-semibold">{formatCurrency(summary.totalSubcontractorCost)}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-t-2 border-blue-700 mt-2">
            <span className="text-blue-700 font-bold text-lg">GRAND TOTAL:</span>
            <span className="text-blue-700 font-bold text-xl">{formatCurrency(summary.grandTotal)}</span>
          </div>

          <div className="text-sm text-gray-600 pt-2">
            Total Line Items: {summary.lineItemCount}
          </div>
        </div>
      </div>

      {sortedCategories.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Breakdown by Category</h3>

          <div className="space-y-2">
            {sortedCategories.map(([category, total]) => {
              const percentage = (total / summary.grandTotal) * 100;
              return (
                <div key={category} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{category}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(total)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
