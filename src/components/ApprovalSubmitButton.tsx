import React, { useState, useEffect } from 'react';
import { Send, Lock, CheckCircle, XCircle, RotateCcw, Clock } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { submitProjectForApproval, getProjectApproval, getActiveWorkflow } from '../utils/approvalDatabase';

interface ApprovalSubmitButtonProps {
  projectId: string;
  projectType: 'fm' | 'retrofit' | 'hk';
  onSubmitted?: () => void;
}

export default function ApprovalSubmitButton({
  projectId,
  projectType,
  onSubmitted,
}: ApprovalSubmitButtonProps) {
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [approval, setApproval] = useState<any>(null);
  const [hasActiveWorkflow, setHasActiveWorkflow] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkApprovalStatus();
  }, [projectId, projectType]);

  const checkApprovalStatus = async () => {
    if (!currentOrganization) return;

    setChecking(true);
    try {
      const [approvalData, workflowId] = await Promise.all([
        getProjectApproval(projectId, projectType),
        getActiveWorkflow(currentOrganization.id),
      ]);

      setApproval(approvalData);
      setHasActiveWorkflow(!!workflowId);
    } catch (error) {
      console.error('Error checking approval status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!currentOrganization) {
      alert('No organization selected');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Not authenticated');
      return;
    }

    setLoading(true);
    try {
      await submitProjectForApproval(
        projectId,
        projectType,
        user.id,
        currentOrganization.id
      );

      alert('Project submitted for approval successfully!');
      await checkApprovalStatus();

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error) {
      console.error('Error submitting for approval:', error);
      alert('Failed to submit for approval: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Clock className="w-4 h-4 animate-spin" />
        <span>Checking approval status...</span>
      </div>
    );
  }

  if (!hasActiveWorkflow) {
    return (
      <div className="text-sm text-gray-500 italic">
        No active approval workflow configured
      </div>
    );
  }

  if (approval) {
    const statusConfig = {
      pending: {
        icon: Clock,
        color: 'blue',
        text: 'Pending Approval',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
        iconColor: 'text-blue-600',
      },
      approved: {
        icon: CheckCircle,
        color: 'green',
        text: 'Approved',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        iconColor: 'text-green-600',
      },
      rejected: {
        icon: XCircle,
        color: 'red',
        text: 'Rejected',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        iconColor: 'text-red-600',
      },
      revision_requested: {
        icon: RotateCcw,
        color: 'orange',
        text: 'Revision Requested',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-700',
        iconColor: 'text-orange-600',
      },
      draft: {
        icon: Clock,
        color: 'gray',
        text: 'Draft',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        iconColor: 'text-gray-600',
      },
    };

    const config = statusConfig[approval.status as keyof typeof statusConfig];
    const Icon = config.icon;

    // For revision_requested status, show both status badge and resubmit button
    if (approval.status === 'revision_requested') {
      return (
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${config.bgColor}`}>
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
            <div className="flex-1">
              <div className={`font-medium ${config.textColor}`}>{config.text}</div>
              {approval.workflow_name && (
                <div className="text-xs text-gray-600">
                  Workflow: {approval.workflow_name}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {loading ? 'Resubmitting...' : 'Resubmit for Approval'}
          </button>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${config.bgColor}`}>
        <Icon className={`w-5 h-5 ${config.iconColor}`} />
        <div className="flex-1">
          <div className={`font-medium ${config.textColor}`}>{config.text}</div>
          {approval.workflow_name && (
            <div className="text-xs text-gray-600">
              Workflow: {approval.workflow_name}
            </div>
          )}
        </div>
        {approval.status === 'pending' && (
          <Lock className="w-4 h-4 text-gray-400" title="Project is locked during approval" />
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Send className="w-4 h-4" />
      {loading ? 'Submitting...' : 'Submit for Approval'}
    </button>
  );
}

import { supabase } from '../lib/supabase';
