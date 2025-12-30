import type { FMResults } from '../../types/fm';

interface Props {
  results: FMResults;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDecimal = (value: number): string => {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export default function ResultsPanelFM({ results }: Props) {
  const monthlyInHouse = results.inHouseStack.selling / 12;
  const monthlySubcontract = results.subcontractStack.selling / 12;
  const monthlyGrandTotal = results.grandTotal / 12;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">FM Estimator Results</h2>
        {results.validationWarnings && results.validationWarnings.length > 0 && (
          <div className="mb-3 px-4 py-3 bg-red-50 border border-red-300 rounded-lg">
            <div className="font-bold text-red-800 mb-1">⚠️ Data Validation Errors</div>
            {results.validationWarnings.map((warning, idx) => (
              <div key={idx} className="text-sm text-red-700">{warning}</div>
            ))}
          </div>
        )}
        <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
          <strong>Note:</strong> Deployment models are set per technician type (Resident or Rotating)
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Manpower Summary</h3>
        <div className="space-y-3 text-sm">
          {results.manpowerByType.map((m) => (
            <div key={m.techTypeId} className="border-b border-gray-100 pb-2">
              <div className="flex items-center gap-2 font-medium text-gray-800 mb-1">
                <span>{m.techTypeName}</span>
                <span className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: m.deploymentModel === 'resident' ? '#dbeafe' : '#d1fae5',
                    color: m.deploymentModel === 'resident' ? '#1e40af' : '#065f46'
                  }}>
                  {m.deploymentModel === 'resident' ? '🏠 Resident' : '🔄 Rotating'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <span className="text-gray-600">Annual Hours:</span>
                <span className="text-right">{formatDecimal(m.totalAnnualHours)} hrs</span>
                <span className="text-gray-600">Active FTE:</span>
                <span className="text-right">{formatDecimal(m.activeFTE)}</span>
                <span className="text-gray-600">Total w/ Relievers:</span>
                <span className="text-right">{formatDecimal(m.totalWithRelievers)}</span>
                <span className="text-gray-600">Headcount:</span>
                <span className="text-right font-semibold">
                  {formatDecimal(m.headcount)}
                </span>
                {m.overtimeMonthlyHours > 0 && (
                  <>
                    <span className="text-gray-600">OT Hours/Month:</span>
                    <span className="text-right text-orange-600">{formatDecimal(m.overtimeMonthlyHours)} hrs</span>
                    <span className="text-gray-600">OT Cost/Month:</span>
                    <span className="text-right text-orange-600">{formatCurrency(m.overtimeMonthlyCost)} AED</span>
                  </>
                )}
              </div>
            </div>
          ))}
          <div className="pt-2 border-t-2 border-gray-200">
            <div className="grid grid-cols-2 gap-1 text-sm font-medium">
              <span className="text-gray-800">Total Active FTE:</span>
              <span className="text-right">{formatDecimal(results.totalActiveFTE)}</span>
              <span className="text-gray-800">Total w/ Relievers:</span>
              <span className="text-right">{formatDecimal(results.totalWithRelievers)}</span>
              <span className="text-gray-800" style={{ color: '#1e40af' }}>🏠 Resident Headcount:</span>
              <span className="text-right" style={{ color: '#1e40af' }}>{formatDecimal(results.totalResidentHeadcount)}</span>
              <span className="text-gray-800" style={{ color: '#065f46' }}>🔄 Rotating FTE:</span>
              <span className="text-right" style={{ color: '#065f46' }}>{formatDecimal(results.totalRotatingFTE)}</span>
              <span className="text-gray-800">Supervisors ({results.supervisorDeploymentModel === 'resident' ? '🏠' : '🔄'}):</span>
              <span className="text-right">{formatDecimal(results.supervisorsCount)}</span>
              <span className="text-gray-800 font-bold">Total Headcount:</span>
              <span className="text-right font-bold">
                {formatDecimal(results.totalInHouseHeadcount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">In-House Cost Stack</h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-1">
            <span className="text-gray-700">Manpower (Annual):</span>
            <span className="text-right">{formatCurrency(results.inHouseStack.manpowerAnnual)} AED</span>
            <span className="text-gray-700">Supervision (Annual):</span>
            <span className="text-right">{formatCurrency(results.inHouseStack.supervisionAnnual)} AED</span>
            {results.inHouseStack.overtimeAnnual > 0 && (
              <>
                <span className="text-gray-700">Overtime (Annual):</span>
                <span className="text-right text-orange-600">{formatCurrency(results.inHouseStack.overtimeAnnual)} AED</span>
              </>
            )}
            <span className="text-gray-700">Materials (Annual):</span>
            <span className="text-right">{formatCurrency(results.inHouseStack.materialsAnnual)} AED</span>
            <span className="text-gray-700">Consumables (Annual):</span>
            <span className="text-right">{formatCurrency(results.inHouseStack.consumablesAnnual)} AED</span>
            <span className="text-gray-700">Overheads:</span>
            <span className="text-right">{formatCurrency(results.inHouseStack.overheads)} AED</span>
          </div>
          <div className="pt-2 border-t border-blue-200">
            <div className="grid grid-cols-2 gap-1 font-medium">
              <span className="text-gray-800">Subtotal:</span>
              <span className="text-right">{formatCurrency(results.inHouseStack.subtotal)} AED</span>
              <span className="text-gray-800">Profit:</span>
              <span className="text-right">{formatCurrency(results.inHouseStack.profit)} AED</span>
              <span className="text-gray-800 font-bold">Selling (Annual):</span>
              <span className="text-right font-bold text-blue-600">{formatCurrency(results.inHouseStack.selling)} AED</span>
              <span className="text-gray-800 font-bold">Selling (Monthly):</span>
              <span className="text-right font-bold text-blue-600">{formatCurrency(monthlyInHouse)} AED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-300 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Subcontract Cost Stack</h3>
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-1">
            <span className="text-gray-700">Base (Annual):</span>
            <span className="text-right">{formatCurrency(results.subcontractStack.baseAnnual)} AED</span>
            <span className="text-gray-700">Overheads:</span>
            <span className="text-right">{formatCurrency(results.subcontractStack.overheads)} AED</span>
          </div>
          <div className="pt-2 border-t border-green-200">
            <div className="grid grid-cols-2 gap-1 font-medium">
              <span className="text-gray-800">Subtotal:</span>
              <span className="text-right">{formatCurrency(results.subcontractStack.subtotal)} AED</span>
              <span className="text-gray-800">Profit:</span>
              <span className="text-right">{formatCurrency(results.subcontractStack.profit)} AED</span>
              <span className="text-gray-800 font-bold">Selling (Annual):</span>
              <span className="text-right font-bold text-green-600">{formatCurrency(results.subcontractStack.selling)} AED</span>
              <span className="text-gray-800 font-bold">Selling (Monthly):</span>
              <span className="text-right font-bold text-green-600">{formatCurrency(monthlySubcontract)} AED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-400 rounded-lg p-4 shadow-md">
        <h3 className="font-semibold text-gray-800 mb-3 text-lg">Grand Total</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-lg font-bold">
            <span className="text-gray-800">Annual:</span>
            <span className="text-right text-amber-700">{formatCurrency(results.grandTotal)} AED</span>
            <span className="text-gray-800">Monthly:</span>
            <span className="text-right text-amber-700">{formatCurrency(monthlyGrandTotal)} AED</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-3">Breakdown Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-2 py-1 text-left">Category</th>
                <th className="px-2 py-1 text-right">Annual (AED)</th>
                <th className="px-2 py-1 text-right">Monthly (AED)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="px-2 py-1 font-medium text-blue-700">In-House Selling</td>
                <td className="px-2 py-1 text-right">{formatCurrency(results.inHouseStack.selling)}</td>
                <td className="px-2 py-1 text-right">{formatCurrency(monthlyInHouse)}</td>
              </tr>
              <tr className="border-b">
                <td className="px-2 py-1 font-medium text-green-700">Subcontract Selling</td>
                <td className="px-2 py-1 text-right">{formatCurrency(results.subcontractStack.selling)}</td>
                <td className="px-2 py-1 text-right">{formatCurrency(monthlySubcontract)}</td>
              </tr>
              <tr className="bg-amber-50 font-bold">
                <td className="px-2 py-1">Grand Total</td>
                <td className="px-2 py-1 text-right">{formatCurrency(results.grandTotal)}</td>
                <td className="px-2 py-1 text-right">{formatCurrency(monthlyGrandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
