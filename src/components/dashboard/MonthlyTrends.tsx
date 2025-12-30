import { formatCurrency } from '../../utils/currencyFormatter';
import { useOrganization } from '../../contexts/OrganizationContext';
import type { MonthlyTrend } from '../../utils/dashboardMetrics';

interface MonthlyTrendsProps {
  trends: MonthlyTrend[];
}

export function MonthlyTrends({ trends }: MonthlyTrendsProps) {
  const { organization } = useOrganization();
  const currency = organization?.currency || 'AED';

  const maxCreated = Math.max(...trends.map(t => t.created), 1);
  const maxValue = Math.max(...trends.map(t => t.value), 1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Trends</h3>

      {trends.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No data available</p>
      ) : (
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-700">Projects Created</p>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span className="text-gray-600">Created</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-amber-500"></div>
                  <span className="text-gray-600">Submitted</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-gray-600">Awarded</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {trends.map((trend, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="font-medium">{trend.month}</span>
                    <span>{trend.created} projects</span>
                  </div>
                  <div className="flex gap-1 h-6">
                    <div
                      className="bg-blue-500 rounded transition-all hover:opacity-80 flex items-center justify-center text-xs text-white font-medium"
                      style={{ width: `${(trend.created / maxCreated) * 100}%` }}
                      title={`Created: ${trend.created}`}
                    >
                      {trend.created > 0 && <span>{trend.created}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 h-4">
                    {trend.submitted > 0 && (
                      <div
                        className="bg-amber-500 rounded transition-all hover:opacity-80"
                        style={{ width: `${(trend.submitted / maxCreated) * 100}%` }}
                        title={`Submitted: ${trend.submitted}`}
                      ></div>
                    )}
                    {trend.awarded > 0 && (
                      <div
                        className="bg-green-500 rounded transition-all hover:opacity-80"
                        style={{ width: `${(trend.awarded / maxCreated) * 100}%` }}
                        title={`Awarded: ${trend.awarded}`}
                      ></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Project Value</p>
            <div className="space-y-2">
              {trends.map((trend, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-16 text-right">{trend.month}</span>
                  <div className="flex-1 flex items-center gap-2">
                    <div
                      className="bg-gradient-to-r from-teal-400 to-teal-600 h-7 rounded flex items-center justify-end px-3 transition-all hover:opacity-80"
                      style={{ width: `${(trend.value / maxValue) * 100}%` }}
                    >
                      {trend.value > 0 && (
                        <span className="text-xs text-white font-medium">
                          {formatCurrency(trend.value, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
