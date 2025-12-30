import { Eye } from 'lucide-react';

interface ViewOnlyBadgeProps {
  className?: string;
}

export function ViewOnlyBadge({ className = '' }: ViewOnlyBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 ${className}`}>
      <Eye className="w-4 h-4" />
      <span>View Only</span>
    </div>
  );
}
