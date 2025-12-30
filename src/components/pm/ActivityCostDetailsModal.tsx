import React, { useEffect, useState } from 'react';
import { X, DollarSign, Users, Package, Truck, Briefcase, FileText, Box } from 'lucide-react';
import { getActualCosts, ActualCost } from '../../utils/budgetDatabase';

interface ActivityCostDetailsModalProps {
  projectId: string;
  activityId: string;
  activityName: string;
  onClose: () => void;
}

export function ActivityCostDetailsModal({ projectId, activityId, activityName, onClose }: ActivityCostDetailsModalProps) {
  const [costs, setCosts] = useState<ActualCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCosts();
  }, [projectId, activityId]);

  const loadCosts = async () => {
    try {
      setLoading(true);
      const data = await getActualCosts(projectId, { activityId });
      setCosts(data);
    } catch (error) {
      console.error('Error loading activity costs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'labor':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'material':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'equipment':
        return <Truck className="h-4 w-4 text-purple-600" />;
      case 'subcontractor':
        return <Briefcase className="h-4 w-4 text-orange-600" />;
      case 'asset':
        return <Box className="h-4 w-4 text-cyan-600" />;
      default:
        return <FileText className="h-4 w-4 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reviewed':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Reviewed</span>;
      case 'pending_review':
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">Pending Review</span>;
      case 'rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejected</span>;
      case 'draft':
        return <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-800">Draft</span>;
      default:
        return null;
    }
  };

  const totalSpent = costs.filter(c => c.status === 'reviewed').reduce((sum, c) => sum + Number(c.total_amount), 0);
  const totalCommitted = costs.filter(c => c.status === 'pending_review').reduce((sum, c) => sum + Number(c.total_amount), 0);
  const totalDraft = costs.filter(c => c.status === 'draft').reduce((sum, c) => sum + Number(c.total_amount), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Activity Costs</h2>
              <p className="text-sm text-slate-600">{activityName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 border-b border-slate-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm font-medium text-green-600 mb-1">Spent (Reviewed)</div>
              <div className="text-2xl font-bold text-green-900">{formatCurrency(totalSpent)}</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="text-sm font-medium text-amber-600 mb-1">Pending Review</div>
              <div className="text-2xl font-bold text-amber-900">{formatCurrency(totalCommitted)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <div className="text-sm font-medium text-slate-600 mb-1">Draft</div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalDraft)}</div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : costs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No costs logged for this activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {costs.map((cost) => (
                <div key={cost.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200 hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(cost.cost_type)}
                      <div>
                        <div className="font-medium text-slate-900">{cost.description}</div>
                        <div className="text-xs text-slate-500 capitalize">{cost.cost_type}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{formatCurrency(cost.total_amount)}</div>
                      {getStatusBadge(cost.status)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span>{formatDate(cost.cost_date)}</span>
                    {cost.quantity && cost.unit_price && (
                      <span className="text-slate-500">
                        {cost.quantity} × {formatCurrency(cost.unit_price)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
