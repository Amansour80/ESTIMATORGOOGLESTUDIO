import { Layers, Wrench, HardHat } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';
import { useOrganization } from '../../contexts/OrganizationContext';

interface EstimatorComparisonProps {
  hk: {
    count: number;
    value: number;
    winRate: number;
    avgValue: number;
    decidedCount?: number;
    awardedCount?: number;
  };
  fm: {
    count: number;
    value: number;
    winRate: number;
    avgValue: number;
    decidedCount?: number;
    awardedCount?: number;
  };
  retrofit: {
    count: number;
    value: number;
    winRate: number;
    avgValue: number;
    decidedCount?: number;
    awardedCount?: number;
  };
}

export function EstimatorComparison({ hk, fm, retrofit }: EstimatorComparisonProps) {
  const { organization } = useOrganization();
  const currency = organization?.currency || 'AED';

  const estimators = [
    {
      name: 'Housekeeping',
      icon: Layers,
      color: 'bg-green-600',
      data: hk,
      lightColor: 'bg-green-100',
      darkColor: 'text-green-900',
    },
    {
      name: 'FM MEP',
      icon: Wrench,
      color: 'bg-orange-600',
      data: fm,
      lightColor: 'bg-orange-100',
      darkColor: 'text-orange-900',
    },
    {
      name: 'Retrofit',
      icon: HardHat,
      color: 'bg-blue-600',
      data: retrofit,
      lightColor: 'bg-blue-100',
      darkColor: 'text-blue-900',
    },
  ];

  const maxValue = Math.max(hk.value, fm.value, retrofit.value, 1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance by Estimator Type</h3>

      <div className="space-y-6">
        {estimators.map((estimator) => {
          const Icon = estimator.icon;
          const widthPercentage = (estimator.data.value / maxValue) * 100;

          return (
            <div key={estimator.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 ${estimator.color} rounded-lg`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{estimator.name}</p>
                    <p className="text-xs text-gray-500">{estimator.data.count} projects</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(estimator.data.value, currency)}</p>
                  <p className="text-xs text-gray-500">Total Value</p>
                </div>
              </div>

              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 ${estimator.color} transition-all duration-500 flex items-center justify-end px-3`}
                  style={{ width: `${widthPercentage}%` }}
                >
                  {widthPercentage > 20 && (
                    <span className="text-white text-xs font-medium">
                      {formatCurrency(estimator.data.value, currency)}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className={`${estimator.lightColor} rounded-lg p-3`}>
                  <p className={`text-xs ${estimator.darkColor} opacity-70`}>Win Rate</p>
                  <p className={`text-lg font-bold ${estimator.darkColor}`}>
                    {(estimator.data.decidedCount ?? 0) > 0
                      ? `${estimator.data.winRate.toFixed(1)}%`
                      : 'N/A'}
                  </p>
                  {(estimator.data.decidedCount ?? 0) > 0 && (
                    <p className={`text-xs ${estimator.darkColor} opacity-60 mt-1`}>
                      {estimator.data.awardedCount} of {estimator.data.decidedCount} won
                    </p>
                  )}
                </div>
                <div className={`${estimator.lightColor} rounded-lg p-3`}>
                  <p className={`text-xs ${estimator.darkColor} opacity-70`}>Avg Project Value</p>
                  <p className={`text-lg font-bold ${estimator.darkColor}`}>
                    {formatCurrency(estimator.data.avgValue, currency)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hk.count === 0 && fm.count === 0 && retrofit.count === 0 && (
        <p className="text-center text-gray-500 py-8">No projects yet</p>
      )}
    </div>
  );
}
