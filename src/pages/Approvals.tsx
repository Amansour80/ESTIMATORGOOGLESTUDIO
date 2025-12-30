import React from 'react';
import ApprovalDashboard from '../components/ApprovalDashboard';

interface ApprovalsProps {
  onNavigateToProject?: (projectType: 'hk' | 'fm' | 'retrofit', projectId: string) => void;
}

export default function Approvals({ onNavigateToProject }: ApprovalsProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Approvals</h1>
          <p className="text-gray-600">
            Review and approve projects submitted by your team
          </p>
        </div>

        <ApprovalDashboard onNavigateToProject={onNavigateToProject} />
      </div>
    </div>
  );
}
