import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: DataPoint[];
  height?: number;
  horizontal?: boolean;
  showValues?: boolean;
  formatValue?: (value: number) => string;
}

export function BarChart({
  data,
  height = 300,
  horizontal = false,
  showValues = true,
  formatValue = (v) => v.toFixed(0),
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="w-full" style={{ height }}>
      {horizontal ? (
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-24 text-sm font-medium text-gray-700 text-right truncate">
                {item.label}
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden h-8 relative">
                <div
                  className="h-full rounded-lg transition-all duration-500 flex items-center justify-end px-3"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || '#3B82F6',
                  }}
                >
                  {showValues && (
                    <span className="text-xs font-semibold text-white">
                      {formatValue(item.value)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-end justify-between h-full gap-2 pb-8">
          {data.map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden relative" style={{ height: height - 40 }}>
                <div
                  className="w-full absolute bottom-0 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                  style={{
                    height: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || '#3B82F6',
                  }}
                >
                  {showValues && (
                    <span className="text-xs font-semibold text-white">
                      {formatValue(item.value)}
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center truncate w-full">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
