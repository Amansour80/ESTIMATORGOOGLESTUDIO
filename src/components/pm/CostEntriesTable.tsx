import React, { useEffect, useState } from 'react';
import { Check, X, Eye, Clock, FileText, Users, Package, Truck, Briefcase, Send, Trash2 } from 'lucide-react';
import { getActualCosts, reviewActualCost, rejectActualCost, submitCostForReview, deleteActualCost, canUserDeleteCost, ActualCost } from '../../utils/budgetDatabase';
import { CostDetailModal } from './CostDetailModal';
import { CostDeletionModal } from './CostDeletionModal';

interface CostEntriesTableProps {
  projectId: string;
  onRefresh?: () => void;
}

export function CostEntriesTable({ projectId, onRefresh }: CostEntriesTableProps) {
  const [costs, setCosts] = useState<ActualCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedCost, setSelectedCost] = useState<ActualCost | null>(null);
  const [costToDelete, setCostToDelete] = useState<ActualCost | null>(null);
  const [deletePermissions, setDeletePermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadCosts();
  }, [projectId]);

  const loadCosts = async () => {
    try {
      setLoading(true);
      const data = await getActualCosts(projectId);
      setCosts(data);

      const permissions: Record<string, boolean> = {};
      for (const cost of data) {
        permissions[cost.id] = await canUserDeleteCost(cost.id);
      }
      setDeletePermissions(permissions);
    } catch (error) {
      console.error('Error loading costs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForReview = async (costId: string) => {
    try {
      await submitCostForReview(costId);
      await loadCosts();
      onRefresh?.();
    } catch (error) {
      console.error('Error submitting cost for review:', error);
      alert('Failed to submit cost for review');
    }
  };

  const handleReview = async (costId: string) => {
    try {
      await reviewActualCost(costId);
      await loadCosts();
      onRefresh?.();
    } catch (error) {
      console.error('Error reviewing cost:', error);
      alert('Failed to review cost');
    }
  };

  const handleReject = async (costId: string) => {
    try {
      await rejectActualCost(costId);
      await loadCosts();
      onRefresh?.();
    } catch (error) {
      console.error('Error rejecting cost:', error);
      alert('Failed to reject cost');
    }
  };

  const handleDelete = async (reason?: string) => {
    if (!costToDelete) return;

    try {
      await deleteActualCost(costToDelete.id, reason);
      await loadCosts();
      onRefresh?.();
      setCostToDelete(null);
    } catch (error) {
      console.error('Error deleting cost:', error);
      throw error;
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reviewed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <Check className="h-3 w-3" />
          Reviewed
        </span>;
      case 'pending_review':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <Clock className="h-3 w-3" />
          Pending Review
        </span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <X className="h-3 w-3" />
          Rejected
        </span>;
      case 'draft':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
          <FileText className="h-3 w-3" />
          Draft
        </span>;
      default:
        return null;
    }
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
      default:
        return <FileText className="h-4 w-4 text-slate-600" />;
    }
  };

  const filteredCosts = costs.filter(cost => {
    if (filterStatus !== 'all' && cost.status !== filterStatus) return false;
    if (filterType !== 'all' && cost.cost_type !== filterType) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Cost Entries</h2>
            <p className="text-sm text-slate-600 mt-1">All logged costs and expenses</p>
          </div>
        </div>

        <div className="flex gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending Review</option>
            <option value="reviewed">Reviewed</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="labor">Labor</option>
            <option value="material">Material</option>
            <option value="equipment">Equipment</option>
            <option value="subcontractor">Subcontractor</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredCosts.map((cost) => (
              <tr key={cost.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(cost.cost_type)}
                    <span className="text-sm font-medium text-slate-900 capitalize">
                      {cost.cost_type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900">{cost.description}</div>
                  {cost.quantity && cost.unit_price && (
                    <div className="text-xs text-slate-500 mt-1">
                      {cost.quantity} × {formatCurrency(cost.unit_price)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-slate-600">
                    {formatDate(cost.cost_date)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatCurrency(cost.total_amount)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  {getStatusBadge(cost.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex items-center justify-center gap-2">
                    {cost.status === 'draft' && (
                      <button
                        onClick={() => handleSubmitForReview(cost.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                        title="Submit for Review"
                      >
                        <Send className="h-3.5 w-3.5" />
                        Submit for Review
                      </button>
                    )}
                    {cost.status === 'pending_review' && (
                      <>
                        <button
                          onClick={() => handleReview(cost.id)}
                          className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                          title="Accept & Review"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReject(cost.id)}
                          className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                          title="Reject"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {(cost.status === 'reviewed' || cost.status === 'rejected') && (
                      <button
                        onClick={() => setSelectedCost(cost)}
                        className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {deletePermissions[cost.id] && (
                      <button
                        onClick={() => setCostToDelete(cost)}
                        className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                        title="Delete Cost"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCosts.length === 0 && (
        <div className="p-12 text-center">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No cost entries found</p>
          <p className="text-sm text-slate-500 mt-1">Log costs to start tracking project expenses</p>
        </div>
      )}

      {selectedCost && (
        <CostDetailModal
          cost={selectedCost}
          onClose={() => setSelectedCost(null)}
        />
      )}

      {costToDelete && (
        <CostDeletionModal
          costId={costToDelete.id}
          costDescription={costToDelete.description}
          costStatus={costToDelete.status}
          requireReason={costToDelete.status !== 'draft'}
          onConfirm={handleDelete}
          onClose={() => setCostToDelete(null)}
        />
      )}
    </div>
  );
}
