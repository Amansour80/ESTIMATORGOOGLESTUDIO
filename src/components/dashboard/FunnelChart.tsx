import React from 'react';

interface FunnelStage {
  label: string;
  value: number;
  count: number;
  color: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  formatValue?: (value: number) => string;
}

export function FunnelChart({ stages, formatValue = (v) => v.toFixed(0) }: FunnelChartProps) {
  if (stages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  const maxValue = stages[0]?.value || 1;

  return (
    <div className="space-y-2">
      {stages.map((stage, index) => {
        const widthPercent = (stage.value / maxValue) * 100;
        const conversionRate = index > 0 ? ((stage.value / stages[index - 1].value) * 100).toFixed(1) : '100.0';

        return (
          <div key={index} className="relative">
            <div className="flex items-center justify-center">
              <div
                className="relative rounded-lg py-4 px-6 transition-all duration-500 hover:shadow-lg"
                style={{
                  width: `${widthPercent}%`,
                  backgroundColor: stage.color,
                  minWidth: '40%',
                }}
              >
                <div className="flex items-center justify-between text-white">
                  <div>
                    <div className="font-semibold">{stage.label}</div>
                    <div className="text-sm opacity-90">{stage.count} projects</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatValue(stage.value)}</div>
                    {index > 0 && (
                      <div className="text-xs opacity-90">{conversionRate}% conversion</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
