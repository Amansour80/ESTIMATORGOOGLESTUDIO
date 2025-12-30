import React from 'react';
import { TrendingUp, FileText, FolderOpen, BarChart3, ChevronDown } from 'lucide-react';

export type DashboardType = 'bd' | 'estimation' | 'pm' | 'overall_performance';

interface DashboardSelectorProps {
  selectedDashboard: DashboardType;
  onSelectDashboard: (dashboard: DashboardType) => void;
}

const dashboards = [
  {
    id: 'bd' as DashboardType,
    name: 'Business Development',
    description: 'Inquiry management, lead conversion, client engagement',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'estimation' as DashboardType,
    name: 'Estimation & Submissions',
    description: 'Estimation performance, submission tracking, win rates',
    icon: FileText,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'pm' as DashboardType,
    name: 'Project Management & Operations',
    description: 'Active project execution, budget/schedule tracking',
    icon: FolderOpen,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'overall_performance' as DashboardType,
    name: 'Overall Performance Dash',
    description: 'Executive insights and real-time analytics',
    icon: BarChart3,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

export function DashboardSelector({ selectedDashboard, onSelectDashboard }: DashboardSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedDashboardData = dashboards.find(d => d.id === selectedDashboard);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-all w-full md:w-auto min-w-[320px]"
      >
        {selectedDashboardData && (
          <>
            <div className={`p-2 rounded-lg ${selectedDashboardData.bgColor}`}>
              <selectedDashboardData.icon className={`w-5 h-5 ${selectedDashboardData.color}`} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900">
                {selectedDashboardData.name}
              </p>
              <p className="text-xs text-gray-500 hidden md:block">
                {selectedDashboardData.description}
              </p>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-full md:w-[480px] bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
            {dashboards.map((dashboard) => {
              const Icon = dashboard.icon;
              const isSelected = dashboard.id === selectedDashboard;

              return (
                <button
                  key={dashboard.id}
                  onClick={() => {
                    onSelectDashboard(dashboard.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-gray-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg ${dashboard.bgColor} flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${dashboard.color}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-blue-600' : 'text-gray-900'}`}>
                      {dashboard.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dashboard.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
