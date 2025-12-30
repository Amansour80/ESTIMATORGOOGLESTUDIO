import { Layers, Wrench, HardHat, Clock } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import { formatCurrency } from '../../utils/currencyFormatter';
import { useOrganization } from '../../contexts/OrganizationContext';
import type { ProjectStatus } from '../../types/projectStatus';

interface RecentProject {
  id: string;
  name: string;
  type: 'hk' | 'fm' | 'retrofit';
  value: number;
  status: ProjectStatus;
  updatedAt: string;
}

interface RecentActivityProps {
  projects: RecentProject[];
  onNavigate: (type: 'hk' | 'fm' | 'retrofit', projectId: string) => void;
}

export function RecentActivity({ projects, onNavigate }: RecentActivityProps) {
  const { organization } = useOrganization();
  const currency = organization?.currency || 'AED';

  const getIcon = (type: 'hk' | 'fm' | 'retrofit') => {
    switch (type) {
      case 'hk':
        return { Icon: Layers, color: 'bg-green-600' };
      case 'fm':
        return { Icon: Wrench, color: 'bg-orange-600' };
      case 'retrofit':
        return { Icon: HardHat, color: 'bg-blue-600' };
    }
  };

  const getTypeLabel = (type: 'hk' | 'fm' | 'retrofit') => {
    switch (type) {
      case 'hk':
        return 'Housekeeping';
      case 'fm':
        return 'FM MEP';
      case 'retrofit':
        return 'Retrofit';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>

      {projects.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No recent activity</p>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const { Icon, color } = getIcon(project.type);
            return (
              <button
                key={project.id}
                onClick={() => onNavigate(project.type, project.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
              >
                <div className={`p-2 ${color} rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                      {project.name}
                    </p>
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{getTypeLabel(project.type)}</span>
                    <span>•</span>
                    <span className="font-medium">{formatCurrency(project.value, currency)}</span>
                    <span>•</span>
                    <span>{formatDate(project.updatedAt)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
