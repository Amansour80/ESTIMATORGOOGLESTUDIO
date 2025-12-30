import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DataPoint[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({
  data,
  size = 200,
  thickness = 40,
  showLegend = true,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulatedAngle = -90;
  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;

    return {
      ...item,
      percentage,
      startAngle,
      angle,
    };
  });

  const polarToCartesian = (angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {segments.map((segment, index) => {
            const start = polarToCartesian(segment.startAngle);
            const end = polarToCartesian(segment.startAngle + segment.angle);
            const largeArcFlag = segment.angle > 180 ? 1 : 0;

            const pathData = [
              `M ${start.x} ${start.y}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
            ].join(' ');

            return (
              <path
                key={index}
                d={pathData}
                fill="none"
                stroke={segment.color}
                strokeWidth={thickness}
                strokeLinecap="round"
                className="transition-all duration-300 hover:opacity-80"
              />
            );
          })}
        </svg>

        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <div className="text-2xl font-bold text-gray-900">{centerValue}</div>
            )}
            {centerLabel && (
              <div className="text-sm text-gray-600">{centerLabel}</div>
            )}
          </div>
        )}
      </div>

      {showLegend && (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900 ml-auto">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
