import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  formatValue?: (value: number) => string;
  secondaryData?: DataPoint[];
  secondaryColor?: string;
  showLegend?: boolean;
  legendLabels?: [string, string];
}

export function LineChart({
  data,
  height = 200,
  color = '#3B82F6',
  showGrid = true,
  showLabels = true,
  formatValue = (v) => v.toFixed(0),
  secondaryData,
  secondaryColor = '#10B981',
  showLegend = false,
  legendLabels = ['Primary', 'Secondary'],
}: LineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        No data available
      </div>
    );
  }

  const allValues = [
    ...data.map(d => d.value),
    ...(secondaryData ? secondaryData.map(d => d.value) : [])
  ];
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const range = maxValue - minValue || 1;
  const padding = 40;
  const chartHeight = height - padding * 2;
  const chartWidth = 100;
  const stepX = chartWidth / (data.length - 1 || 1);

  const points = data.map((point, index) => {
    const x = index * stepX;
    const y = chartHeight - ((point.value - minValue) / range) * chartHeight;
    return { x, y, value: point.value, label: point.label };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaData = `${pathData} L ${points[points.length - 1].x} ${chartHeight} L 0 ${chartHeight} Z`;

  let secondaryPoints, secondaryPathData;
  if (secondaryData && secondaryData.length > 0) {
    secondaryPoints = secondaryData.map((point, index) => {
      const x = index * stepX;
      const y = chartHeight - ((point.value - minValue) / range) * chartHeight;
      return { x, y, value: point.value, label: point.label };
    });
    secondaryPathData = secondaryPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  return (
    <div className="relative w-full" style={{ height }}>
      {showLegend && (
        <div className="flex items-center justify-end gap-4 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-600">{legendLabels[0]}</span>
          </div>
          {secondaryData && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: secondaryColor }} />
              <span className="text-xs text-gray-600">{legendLabels[1]}</span>
            </div>
          )}
        </div>
      )}
      <svg
        viewBox={`-${padding} -${padding} ${chartWidth + padding * 2} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
          {secondaryData && (
            <linearGradient id="secondaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.05" />
            </linearGradient>
          )}
        </defs>

        {showGrid && (
          <g className="grid">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = chartHeight * (1 - ratio);
              return (
                <line
                  key={ratio}
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                />
              );
            })}
          </g>
        )}

        <path d={areaData} fill="url(#lineGradient)" />
        <path d={pathData} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="4" fill="white" stroke={color} strokeWidth="2" />
            <circle cx={point.x} cy={point.y} r="2" fill={color} />
          </g>
        ))}

        {secondaryData && secondaryPoints && secondaryPathData && (
          <>
            <path d={secondaryPathData} fill="none" stroke={secondaryColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            {secondaryPoints.map((point, index) => (
              <g key={`secondary-${index}`}>
                <circle cx={point.x} cy={point.y} r="4" fill="white" stroke={secondaryColor} strokeWidth="2" />
                <circle cx={point.x} cy={point.y} r="2" fill={secondaryColor} />
              </g>
            ))}
          </>
        )}
      </svg>

      {showLabels && (
        <div className="flex justify-between mt-2 px-4">
          {data.map((point, index) => (
            <span key={index} className="text-xs text-gray-600">
              {point.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
