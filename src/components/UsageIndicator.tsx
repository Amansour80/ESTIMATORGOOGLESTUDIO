import { useUsageLimits } from '../hooks/useUsageLimits';
import { Loader2 } from 'lucide-react';

interface UsageIndicatorProps {
  type: 'projects' | 'inquiries';
  className?: string;
}

export function UsageIndicator({ type, className = '' }: UsageIndicatorProps) {
  const { usage, loading, getProjectsRemaining, getInquiriesRemaining } = useUsageLimits();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Loading usage...</span>
      </div>
    );
  }

  if (!usage?.limits) {
    return null;
  }

  const remaining = type === 'projects' ? getProjectsRemaining() : getInquiriesRemaining();
  const max = type === 'projects' ? usage.limits.max_projects : usage.limits.max_inquiries_per_month;
  const current = type === 'projects' ? usage.projects_count : usage.inquiries_count;

  if (remaining === null) {
    return (
      <div className={`text-xs text-gray-500 ${className}`}>
        Unlimited {type}
      </div>
    );
  }

  const percentage = max ? (current / max) * 100 : 0;
  const isWarning = remaining <= 1;
  const isCritical = remaining === 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 max-w-[120px]">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCritical
                ? 'bg-red-500'
                : isWarning
                ? 'bg-yellow-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>
      <span
        className={`text-xs font-medium ${
          isCritical
            ? 'text-red-600'
            : isWarning
            ? 'text-yellow-600'
            : 'text-gray-600'
        }`}
      >
        {current}/{max} used
      </span>
    </div>
  );
}