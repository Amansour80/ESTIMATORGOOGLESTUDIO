import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RotateCcw, Clock, MessageSquare, History, ExternalLink, Eye } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { getMyPendingApprovals, processApprovalAction, getApprovalHistory, canUserApprove } from '../utils/approvalDatabase';
import { supabase } from '../lib/supabase';

interface ApprovalDashboardProps {
  onNavigateToProject?: (projectType: 'hk' | 'fm' | 'retrofit', projectId: string) => void;
}

export default function ApprovalDashboard({ onNavigateToProject }: ApprovalDashboardProps) {
  const { currentOrganization } = useOrganization();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');
  const [canApprove, setCanApprove] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, [currentOrganization]);

  useEffect(() => {
    if (selectedApproval) {
      checkCanApprove();
      loadHistory();
    }
  }, [selectedApproval]);

  const loadApprovals = async () => {
    if (!currentOrganization) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getMyPendingApprovals(user.id, currentOrganization.id);
      setApprovals(data);
    } catch (error) {
      console.error('Error loading approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanApprove = async () => {
    if (!selectedApproval) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await canUserApprove(selectedApproval.id, user.id);
      setCanApprove(result);
    } catch (error) {
      console.error('Error checking approval permission:', error);
      setCanApprove(false);
    }
  };

  const loadHistory = async () => {
    if (!selectedApproval) return;

    try {
      const data = await getApprovalHistory(selectedApproval.id);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const handleAction = async (action: 'approved' | 'rejected' | 'revision_requested') => {
    if (!selectedApproval) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setActionLoading(true);
    try {
      await processApprovalAction(
        selectedApproval.id,
        user.id,
        action,
        comments || undefined
      );

      alert(`Project ${action === 'approved' ? 'approved' : action === 'rejected' ? 'rejected' : 'returned for revision'} successfully!`);
      setSelectedApproval(null);
      setComments('');
      await loadApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Failed to process approval: ' + (error as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'fm': return 'Facilities Management';
      case 'retrofit': return 'Retrofit';
      case 'hk': return 'Housekeeping';
      default: return type;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Clock className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <div className="text-center p-12">
        <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
        <p className="text-gray-500">You have no projects waiting for your approval.</p>
      </div>
    );
  }

  if (selectedApproval) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedApproval(null)}
          className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          ← Back to List
        </button>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {getProjectTypeLabel(selectedApproval.project_type)} Project
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Workflow: {selectedApproval.workflow_name}</span>
                  <span>•</span>
                  <span>Submitted: {formatDate(selectedApproval.submitted_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onNavigateToProject && (
                  <button
                    onClick={() => onNavigateToProject(
                      selectedApproval.project_type as 'hk' | 'fm' | 'retrofit',
                      selectedApproval.project_id
                    )}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Project
                  </button>
                )}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  <History className="w-4 h-4" />
                  {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>
            </div>

            {selectedApproval.metadata && (
              <div className="bg-white rounded-lg p-4 space-y-2">
                <h3 className="font-medium text-gray-900 mb-3">Project Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedApproval.metadata.project_value && (
                    <div>
                      <span className="text-gray-600">Project Value:</span>
                      <span className="ml-2 font-medium">
                        ${Number(selectedApproval.metadata.project_value).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedApproval.metadata.calculated_value && (
                    <div>
                      <span className="text-gray-600">Calculated Value:</span>
                      <span className="ml-2 font-medium">
                        ${Number(selectedApproval.metadata.calculated_value).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {selectedApproval.metadata.client_name && (
                    <div>
                      <span className="text-gray-600">Client:</span>
                      <span className="ml-2 font-medium">{selectedApproval.metadata.client_name}</span>
                    </div>
                  )}
                  {selectedApproval.metadata.duration_months && (
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2 font-medium">
                        {selectedApproval.metadata.duration_months} months
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {showHistory && history.length > 0 && (
            <div className="p-6 border-b border-gray-200 bg-blue-50">
              <h3 className="font-medium text-gray-900 mb-4">Approval History</h3>
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 bg-white rounded-lg p-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {item.user?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                          {item.action}
                        </span>
                      </div>
                      {item.comments && (
                        <p className="text-sm text-gray-600 mb-1">{item.comments}</p>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {canApprove ? (
            <div className="p-6">
              <h3 className="font-medium text-gray-900 mb-4">Take Action</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (optional)
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add comments about your decision..."
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAction('approved')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>

                <button
                  onClick={() => handleAction('revision_requested')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Request Revision
                </button>

                <button
                  onClick={() => handleAction('rejected')}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-yellow-50 border-t border-yellow-200">
              <p className="text-sm text-yellow-800">
                You do not have permission to approve at this step of the workflow.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Pending Approvals ({approvals.length})
      </h2>

      <div className="grid gap-4">
        {approvals.map((approval) => (
          <div
            key={approval.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedApproval(approval)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-gray-900">
                    {getProjectTypeLabel(approval.project_type)} Project
                  </h3>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    Pending
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div>Workflow: {approval.workflow_name}</div>
                  <div>Submitted: {formatDate(approval.submitted_at)}</div>
                  {approval.metadata?.project_value && (
                    <div>
                      Value: ${Number(approval.metadata.project_value).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <ExternalLink className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
