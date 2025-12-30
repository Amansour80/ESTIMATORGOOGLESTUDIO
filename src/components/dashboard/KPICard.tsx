import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyFormatter';
import { useOrganization } from '../../contexts/OrganizationContext';

interface KPICardProps {
  title: string;
  value: number;
  isPercentage?: boolean;
  isCurrency?: boolean;
  trend?: number;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'teal';
  subtitle?: string;
}

export function KPICard({
  title,
  value,
  isPercentage = false,
  isCurrency = false,
  trend,
  icon,
  color = 'blue',
  subtitle,
}: KPICardProps) {
  const { organization } = useOrganization();
  const currency = organization?.currency || 'AED';

  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 text-blue-900',
    green: 'from-green-50 to-green-100 text-green-900',
    orange: 'from-orange-50 to-orange-100 text-orange-900',
    red: 'from-red-50 to-red-100 text-red-900',
    gray: 'from-gray-50 to-gray-100 text-gray-900',
    teal: 'from-teal-50 to-teal-100 text-teal-900',
  };

  const formatValue = () => {
    if (isCurrency) {
      return formatCurrency(value, currency);
    }
    if (isPercentage) {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) return <Minus className="w-4 h-4" />;
    if (trend > 0) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-gray-500';
    if (trend > 0) return 'text-green-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium opacity-80">{title}</p>
        {icon && <div className="opacity-60">{icon}</div>}
      </div>
      <p className="text-3xl font-bold mb-2">{formatValue()}</p>
      {subtitle && <p className="text-xs opacity-70 mb-2">{subtitle}</p>}
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="font-medium">{Math.abs(trend).toFixed(1)}%</span>
          <span className="opacity-70 text-xs">vs last period</span>
        </div>
      )}
    </div>
  );
}
