import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal';
  size?: 'sm' | 'md' | 'lg';
}

const colorClasses = {
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  orange: 'bg-orange-500 text-white',
  red: 'bg-red-500 text-white',
  purple: 'bg-pink-500 text-white',
  teal: 'bg-teal-500 text-white',
};

const colorBgClasses = {
  blue: 'bg-blue-50',
  green: 'bg-green-50',
  orange: 'bg-orange-50',
  red: 'bg-red-50',
  purple: 'bg-pink-50',
  teal: 'bg-teal-50',
};

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'blue',
  size = 'md',
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === null) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === null) return 'text-gray-500';
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${colorBgClasses[color]}/30`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`font-bold text-gray-900 ${
            size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-3xl' : 'text-2xl'
          }`}>
            {value}
          </p>
          {(change !== undefined || changeLabel) && (
            <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-semibold">
                {change !== undefined && `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
                {changeLabel && ` ${changeLabel}`}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`${colorClasses[color]} p-3 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
