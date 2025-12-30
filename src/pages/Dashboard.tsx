import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import Breadcrumbs from '../components/Breadcrumbs';
import { DashboardSelector, type DashboardType } from '../components/dashboard/DashboardSelector';
import { BDDashboardView } from '../components/dashboard/BDDashboardView';
import { EstimationDashboardView } from '../components/dashboard/EstimationDashboardView';
import { PMDashboardView } from '../components/dashboard/PMDashboardView';
import InteractiveDashboard from './InteractiveDashboard';

interface DashboardProps {
  user: User;
  onNavigate: (tab: 'hk' | 'fm' | 'retrofit' | 'inquiries', projectId?: string) => void;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardType>('estimation');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs items={[{ label: 'Dashboard' }]} />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 mb-6">Track performance metrics and manage your projects</p>

          <DashboardSelector
            selectedDashboard={selectedDashboard}
            onSelectDashboard={setSelectedDashboard}
          />
        </div>

        {selectedDashboard === 'bd' && <BDDashboardView />}
        {selectedDashboard === 'estimation' && <EstimationDashboardView />}
        {selectedDashboard === 'pm' && (
          <PMDashboardView
            onNavigateToProject={(projectId) => onNavigate('retrofit', projectId)}
          />
        )}
        {selectedDashboard === 'overall_performance' && <InteractiveDashboard user={user} onNavigate={onNavigate} />}
      </div>
    </div>
  );
}
