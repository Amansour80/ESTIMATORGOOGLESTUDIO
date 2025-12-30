import React, { useState } from 'react';
import { DollarSign, Plus, Users, Package, Truck, Briefcase, FileText, Box } from 'lucide-react';
import { BudgetOverview } from './BudgetOverview';
import { ActivityBudgetGrid } from './ActivityBudgetGrid';
import { CostEntriesTable } from './CostEntriesTable';
import { LogLaborCostModal } from './LogLaborCostModal';
import { LogMaterialCostModal } from './LogMaterialCostModal';
import { LogEquipmentCostModal } from './LogEquipmentCostModal';
import { LogSubcontractorCostModal } from './LogSubcontractorCostModal';
import { LogAssetCostModal } from './LogAssetCostModal';
import { LogOverheadCostModal } from './LogOverheadCostModal';
import { ActivityCostDetailsModal } from './ActivityCostDetailsModal';
import { BudgetManagementPanel } from './BudgetManagementPanel';

interface Activity {
  id: string;
  name: string;
  progress_percent: number;
  status: string;
}

interface BudgetTabProps {
  projectId: string;
  organizationId: string;
  activities: Activity[];
  isReadOnly?: boolean;
}

type CostModalType = 'labor' | 'material' | 'equipment' | 'subcontractor' | 'asset' | 'overhead' | null;

export function BudgetTab({ projectId, organizationId, activities, isReadOnly = false }: BudgetTabProps) {
  const [activeCostModal, setActiveCostModal] = useState<CostModalType>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleModalClose = () => {
    setActiveCostModal(null);
  };

  const handleModalSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setActiveCostModal(null);
  };

  const handleViewActivityDetails = (activityId: string) => {
    setSelectedActivityId(activityId);
  };

  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  const costButtons = [
    { type: 'labor' as const, icon: Users, label: 'Labor', color: 'bg-blue-600 hover:bg-blue-700' },
    { type: 'material' as const, icon: Package, label: 'Materials', color: 'bg-green-600 hover:bg-green-700' },
    { type: 'equipment' as const, icon: Truck, label: 'Equipment', color: 'bg-purple-600 hover:bg-purple-700' },
    { type: 'subcontractor' as const, icon: Briefcase, label: 'Subcontractor', color: 'bg-orange-600 hover:bg-orange-700' },
    { type: 'asset' as const, icon: Box, label: 'Assets', color: 'bg-cyan-600 hover:bg-cyan-700' },
    { type: 'overhead' as const, icon: FileText, label: 'Overhead', color: 'bg-slate-600 hover:bg-slate-700' }
  ];

  return (
    <div className="space-y-6">
      {activities.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-yellow-800">No Activities Created Yet</h3>
              <p className="mt-1 text-sm text-yellow-700">
                You need to create activities in the <strong>Activities</strong> tab before you can log costs. Activities help organize and track costs by project phase or work package.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Budget Management</h1>
            <p className="text-sm text-slate-600">Track costs, allocations, and financial performance</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <button
              disabled={activities.length === 0 || isReadOnly}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm ${
                activities.length === 0 || isReadOnly ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={activities.length === 0 ? 'Create activities first' : isReadOnly ? 'Read-only mode' : ''}
            >
              <Plus className="h-5 w-5" />
              Log Cost
            </button>
            {activities.length > 0 && !isReadOnly && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="p-2 space-y-1">
                  {costButtons.map((button) => (
                    <button
                      key={button.type}
                      onClick={() => setActiveCostModal(button.type)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded transition-colors"
                    >
                      <button.icon className="h-4 w-4" />
                      <span className="font-medium">{button.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BudgetOverview key={`overview-${refreshKey}`} projectId={projectId} />

      <BudgetManagementPanel
        projectId={projectId}
        activities={activities}
        onBudgetImported={() => setRefreshKey(prev => prev + 1)}
      />

      <ActivityBudgetGrid
        key={`activities-${refreshKey}`}
        projectId={projectId}
        activities={activities}
        onAllocateBudget={handleViewActivityDetails}
      />

      <CostEntriesTable
        key={`entries-${refreshKey}`}
        projectId={projectId}
        onRefresh={() => setRefreshKey(prev => prev + 1)}
      />

      {activeCostModal === 'labor' && (
        <LogLaborCostModal
          projectId={projectId}
          organizationId={organizationId}
          activities={activities}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {activeCostModal === 'material' && (
        <LogMaterialCostModal
          projectId={projectId}
          activities={activities}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {activeCostModal === 'equipment' && (
        <LogEquipmentCostModal
          projectId={projectId}
          activities={activities}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {activeCostModal === 'subcontractor' && (
        <LogSubcontractorCostModal
          projectId={projectId}
          activities={activities}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {activeCostModal === 'asset' && (
        <LogAssetCostModal
          projectId={projectId}
          activities={activities}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {activeCostModal === 'overhead' && (
        <LogOverheadCostModal
          projectId={projectId}
          organizationId={organizationId}
          activities={activities}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}

      {selectedActivityId && selectedActivity && (
        <ActivityCostDetailsModal
          projectId={projectId}
          activityId={selectedActivityId}
          activityName={selectedActivity.name}
          onClose={() => setSelectedActivityId(null)}
        />
      )}
    </div>
  );
}
