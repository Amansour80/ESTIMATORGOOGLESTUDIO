import React from 'react';
import { Download, FileText } from 'lucide-react';
import { RetrofitResults, RetrofitState } from '../../types/retrofit';
import { exportRetrofitToPDF } from '../../utils/exportRetrofitPDF';
import { exportRetrofitToExcel } from '../../utils/exportRetrofitExcel';

interface ResultsPanelProps {
  results: RetrofitResults;
  state: RetrofitState;
}

export function ResultsPanel({ results, state }: ResultsPanelProps) {
  const handleExportPDF = () => {
    try {
      exportRetrofitToPDF(state, results);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleExportExcel = () => {
    try {
      exportRetrofitToExcel(state, results);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('Failed to export Excel. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Cost Summary</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <FileText size={18} />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">Project Duration</p>
          <p className="text-2xl font-bold text-blue-900">{results.projectDurationDays} days</p>
        </div>

        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">Total Manpower Hours</p>
          <p className="text-2xl font-bold text-green-900">{results.totalManpowerHours.toLocaleString()} hrs</p>
        </div>

        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <p className="text-sm text-purple-700 font-medium">Total Assets</p>
          <p className="text-2xl font-bold text-purple-900">{results.totalAssetQuantity.toLocaleString()} units</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-700">Manpower Cost</span>
          <span className="font-medium text-gray-900">{results.totalManpowerCost.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-700">Assets Cost</span>
          <span className="font-medium text-gray-900">{results.totalAssetCost.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-700">Removal Cost</span>
          <span className="font-medium text-gray-900">{results.totalRemovalCost.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-700">Subcontractors Cost</span>
          <span className="font-medium text-gray-900">{results.totalSubcontractorCost.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-700">Logistics Cost</span>
          <span className="font-medium text-gray-900">{results.totalLogisticsCost.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-3 bg-blue-50 px-4 rounded-lg">
          <span className="font-semibold text-blue-900">BASE COST</span>
          <span className="font-bold text-blue-900">{results.baseCost.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-700">
            Overheads ({state.costConfig.overheadsPercent}%)
          </span>
          <span className="font-medium text-gray-900">{results.overheadsCost.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-700">
            Performance Bond ({state.costConfig.performanceBondPercent}%)
          </span>
          <span className="font-medium text-gray-900">{results.performanceBondCost.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-700">
            Insurance ({state.costConfig.insurancePercent}%)
          </span>
          <span className="font-medium text-gray-900">{results.insuranceCost.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-700">
            Warranty ({state.costConfig.warrantyPercent}%)
          </span>
          <span className="font-medium text-gray-900">{results.warrantyCost.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-3 bg-gray-100 px-4 rounded-lg">
          <span className="font-semibold text-gray-900">SUBTOTAL</span>
          <span className="font-bold text-gray-900">{results.subtotalBeforeProfit.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-2 border-b border-gray-200">
          <span className="text-gray-700">
            Profit ({state.costConfig.profitPercent}%)
          </span>
          <span className="font-medium text-gray-900">{results.profitAmount.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-4 bg-gradient-to-r from-orange-500 to-orange-600 px-4 rounded-lg">
          <span className="font-bold text-white text-lg">GRAND TOTAL</span>
          <span className="font-bold text-white text-lg">{results.grandTotal.toLocaleString()} AED</span>
        </div>

        <div className="flex justify-between py-3 bg-green-50 px-4 rounded-lg border border-green-200">
          <span className="font-semibold text-green-900">Cost per Asset Unit</span>
          <span className="font-bold text-green-900">
            {results.costPerAssetUnit.toLocaleString()} AED
          </span>
        </div>
      </div>
    </div>
  );
}
