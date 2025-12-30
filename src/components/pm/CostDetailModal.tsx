import React, { useEffect, useState } from 'react';
import { X, Users, Package, Truck, Briefcase, FileText, Calendar, DollarSign } from 'lucide-react';
import {
  ActualCost,
  getLaborCostEntry,
  getMaterialCostEntry,
  getEquipmentCostEntry,
  getSubcontractorCostEntry
} from '../../utils/budgetDatabase';

interface CostDetailModalProps {
  cost: ActualCost;
  onClose: () => void;
}

export function CostDetailModal({ cost, onClose }: CostDetailModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetails();
  }, [cost.id]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      let detailData = null;

      switch (cost.cost_type) {
        case 'labor':
          detailData = await getLaborCostEntry(cost.id);
          break;
        case 'material':
          detailData = await getMaterialCostEntry(cost.id);
          break;
        case 'equipment':
          detailData = await getEquipmentCostEntry(cost.id);
          break;
        case 'subcontractor':
          detailData = await getSubcontractorCostEntry(cost.id);
          break;
      }

      setDetails(detailData);
    } catch (error) {
      console.error('Error loading cost details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeIcon = () => {
    switch (cost.cost_type) {
      case 'labor':
        return <Users className="h-6 w-6 text-blue-600" />;
      case 'material':
        return <Package className="h-6 w-6 text-green-600" />;
      case 'equipment':
        return <Truck className="h-6 w-6 text-purple-600" />;
      case 'subcontractor':
        return <Briefcase className="h-6 w-6 text-orange-600" />;
      default:
        return <FileText className="h-6 w-6 text-slate-600" />;
    }
  };

  const getStatusColor = () => {
    switch (cost.status) {
      case 'reviewed':
        return 'bg-green-100 text-green-800';
      case 'pending_review':
        return 'bg-amber-100 text-amber-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              {getTypeIcon()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 capitalize">{cost.cost_type} Cost Details</h2>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {cost.status.replace('_', ' ')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-600">Total Amount</span>
              <DollarSign className="h-5 w-5 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{formatCurrency(cost.total_amount)}</div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Description</label>
              <p className="mt-1 text-slate-900">{cost.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Cost Date</label>
                <div className="mt-1 flex items-center gap-2 text-slate-900">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {formatDate(cost.cost_date)}
                </div>
              </div>

              {cost.quantity && cost.unit_price && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Quantity & Unit Price</label>
                  <p className="mt-1 text-slate-900">
                    {cost.quantity} × {formatCurrency(cost.unit_price)}
                  </p>
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : details && (
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <h3 className="font-semibold text-slate-900">Additional Details</h3>

                {cost.cost_type === 'labor' && details && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-slate-600">Manpower Type</label>
                      <p className="font-medium text-slate-900">{details.manpower_type}</p>
                    </div>
                    {details.trade && (
                      <div>
                        <label className="text-slate-600">Trade</label>
                        <p className="font-medium text-slate-900">{details.trade}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-slate-600">Number of Workers</label>
                      <p className="font-medium text-slate-900">{details.num_workers}</p>
                    </div>
                    {details.hours_worked && (
                      <div>
                        <label className="text-slate-600">Hours Worked</label>
                        <p className="font-medium text-slate-900">{details.hours_worked} hours</p>
                      </div>
                    )}
                    {details.days_worked && (
                      <div>
                        <label className="text-slate-600">Days Worked</label>
                        <p className="font-medium text-slate-900">{details.days_worked} days</p>
                      </div>
                    )}
                    {details.rate_per_hour && (
                      <div>
                        <label className="text-slate-600">Rate per Hour</label>
                        <p className="font-medium text-slate-900">{formatCurrency(details.rate_per_hour)}</p>
                      </div>
                    )}
                    {details.rate_per_day && (
                      <div>
                        <label className="text-slate-600">Rate per Day</label>
                        <p className="font-medium text-slate-900">{formatCurrency(details.rate_per_day)}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-slate-600">Work Period</label>
                      <p className="font-medium text-slate-900">
                        {formatDate(details.work_date_start)}
                        {details.work_date_end && ` - ${formatDate(details.work_date_end)}`}
                      </p>
                    </div>
                  </div>
                )}

                {cost.cost_type === 'material' && details && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-slate-600">Material Name</label>
                      <p className="font-medium text-slate-900">{details.material_name}</p>
                    </div>
                    <div>
                      <label className="text-slate-600">Quantity</label>
                      <p className="font-medium text-slate-900">{details.quantity} {details.unit}</p>
                    </div>
                    <div>
                      <label className="text-slate-600">Unit Price</label>
                      <p className="font-medium text-slate-900">{formatCurrency(details.unit_price)}</p>
                    </div>
                    {details.supplier && (
                      <div>
                        <label className="text-slate-600">Supplier</label>
                        <p className="font-medium text-slate-900">{details.supplier}</p>
                      </div>
                    )}
                    {details.invoice_number && (
                      <div>
                        <label className="text-slate-600">Invoice Number</label>
                        <p className="font-medium text-slate-900">{details.invoice_number}</p>
                      </div>
                    )}
                  </div>
                )}

                {cost.cost_type === 'equipment' && details && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-slate-600">Equipment Type</label>
                      <p className="font-medium text-slate-900">{details.equipment_type}</p>
                    </div>
                    <div>
                      <label className="text-slate-600">Equipment Name</label>
                      <p className="font-medium text-slate-900">{details.equipment_name}</p>
                    </div>
                    <div>
                      <label className="text-slate-600">Rental Days</label>
                      <p className="font-medium text-slate-900">{details.rental_days} days</p>
                    </div>
                    <div>
                      <label className="text-slate-600">Daily Rate</label>
                      <p className="font-medium text-slate-900">{formatCurrency(details.daily_rate)}</p>
                    </div>
                    {details.supplier && (
                      <div>
                        <label className="text-slate-600">Supplier</label>
                        <p className="font-medium text-slate-900">{details.supplier}</p>
                      </div>
                    )}
                  </div>
                )}

                {cost.cost_type === 'subcontractor' && details && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                      <label className="text-slate-600">Subcontractor Name</label>
                      <p className="font-medium text-slate-900">{details.subcontractor_name}</p>
                    </div>
                    {details.invoice_number && (
                      <div>
                        <label className="text-slate-600">Invoice Number</label>
                        <p className="font-medium text-slate-900">{details.invoice_number}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-slate-600">Progress</label>
                      <p className="font-medium text-slate-900">{details.progress_percentage}%</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-slate-600">Work Description</label>
                      <p className="font-medium text-slate-900">{details.work_description}</p>
                    </div>
                    <div>
                      <label className="text-slate-600">Gross Amount</label>
                      <p className="font-medium text-slate-900">{formatCurrency(details.gross_amount)}</p>
                    </div>
                    <div>
                      <label className="text-slate-600">Retention ({details.retention_percentage}%)</label>
                      <p className="font-medium text-red-600">-{formatCurrency(details.retention_amount)}</p>
                    </div>
                    <div className="col-span-2 bg-slate-100 p-3 rounded">
                      <label className="text-slate-600">Net Payable</label>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(details.net_payable)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
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
