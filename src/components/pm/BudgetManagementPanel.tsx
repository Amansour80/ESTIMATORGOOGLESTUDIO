import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Upload, FileText, AlertTriangle, Plus, X, Save, Download, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { formatCurrency } from '../../utils/currencyFormatter';
import {
  importBudgetFromEstimation,
  getBudgetBaseline,
  deleteBudgetBaseline,
  createBudgetChangeOrder,
  getBudgetChangeOrders,
  createActivityBudgetAllocation,
  getActivityBudgetAllocations,
  createCostForecast,
  getCostForecasts,
  calculateEVMMetrics,
  type BudgetChangeOrder,
  type ActivityBudgetAllocation,
  type CostForecast,
  type EVMMetrics
} from '../../utils/budgetDatabase';

interface Activity {
  id: string;
  name: string;
}

interface BudgetManagementPanelProps {
  projectId: string;
  activities: Activity[];
  onBudgetImported?: () => void;
}

type PanelView = 'overview' | 'import' | 'change-orders' | 'allocation' | 'forecasting' | 'evm';

export const BudgetManagementPanel: React.FC<BudgetManagementPanelProps> = ({ projectId, activities, onBudgetImported }) => {
  const { currentOrganization } = useOrganization();
  const currency = currentOrganization?.currency || 'AED';
  const [activeView, setActiveView] = useState<PanelView>('overview');
  const [baseline, setBaseline] = useState<any>(null);
  const [changeOrders, setChangeOrders] = useState<BudgetChangeOrder[]>([]);
  const [evmMetrics, setEVMMetrics] = useState<EVMMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showChangeOrderModal, setShowChangeOrderModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadBudgetData();
  }, [projectId]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const [baselineData, changeOrdersData, evmData] = await Promise.all([
        getBudgetBaseline(projectId),
        getBudgetChangeOrders(projectId),
        calculateEVMMetrics(projectId)
      ]);

      setBaseline(baselineData);
      setChangeOrders(changeOrdersData);
      setEVMMetrics(evmData);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!baseline) return;

    try {
      await deleteBudgetBaseline(baseline.id);
      await loadBudgetData();
      setShowDeleteConfirm(false);
      onBudgetImported?.();
    } catch (error) {
      console.error('Error deleting budget:', error);
      alert('Failed to delete budget: ' + (error as Error).message);
    }
  };

  const ImportBudgetModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [selectedEstimate, setSelectedEstimate] = useState('');
    const [estimates, setEstimates] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
      loadEstimates();
    }, []);

    const loadEstimates = async () => {
      try {
        if (!currentOrganization) return;

        const { data, error } = await supabase
          .from('retrofit_projects')
          .select('id, project_name, calculated_value, project_data, estimation_mode, boq_line_items')
          .eq('organization_id', currentOrganization.id)
          .not('calculated_value', 'is', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setEstimates(data || []);
      } catch (error) {
        console.error('Error loading estimates:', error);
      }
    };

    const handleImport = async () => {
      if (!selectedEstimate) return;

      try {
        setImporting(true);
        const estimate = estimates.find(e => e.id === selectedEstimate);
        if (!estimate) return;

        let estimationData;

        const boqItems = estimate.boq_line_items || estimate.project_data?.boqLineItems;
        const hasBoqData = (estimate.estimation_mode === 'boq' && estimate.boq_line_items) ||
                          (estimate.project_data?.boqLineItems && estimate.project_data?.boqLineItems.length > 0);

        if (hasBoqData && boqItems) {
          const laborLibrary = estimate.project_data?.laborLibrary || [];
          const laborLibraryMap = new Map(laborLibrary.map((l: any) => [l.id, l]));
          const costConfig = estimate.project_data?.costConfig || {};

          let materialsTotal = 0;
          let laborTotal = 0;
          let subcontractorTotal = 0;
          let equipmentTotal = 0;
          let supervisionTotal = 0;

          boqItems.forEach((item: any) => {
            const quantity = item.quantity || 0;

            materialsTotal += quantity * (item.unitMaterialCost || 0);

            if (item.laborDetailId && item.laborHours > 0) {
              const labor = laborLibraryMap.get(item.laborDetailId);
              if (labor) {
                const hourlyRate = labor.hourlyRate || (labor.monthlySalary + labor.additionalCost) / 208;
                laborTotal += item.laborHours * hourlyRate;
              }
            }

            if (item.supervisionDetailId && item.supervisionHours > 0) {
              const supervisor = laborLibraryMap.get(item.supervisionDetailId);
              if (supervisor) {
                const hourlyRate = supervisor.hourlyRate || (supervisor.monthlySalary + supervisor.additionalCost) / 208;
                supervisionTotal += item.supervisionHours * hourlyRate;
              }
            }

            subcontractorTotal += quantity * (item.subcontractorCost || 0);
            equipmentTotal += quantity * (item.directCost || 0);
          });

          const baseCost = materialsTotal + laborTotal + subcontractorTotal + equipmentTotal + supervisionTotal;

          // Calculate all markup costs matching the retrofit calculation logic
          const overheadsPercent = costConfig.overheadsPercent || 0;
          const performanceBondPercent = costConfig.performanceBondPercent || 0;
          const insurancePercent = costConfig.insurancePercent || 0;
          const warrantyPercent = costConfig.warrantyPercent || 0;
          const profitPercent = costConfig.profitPercent || 0;
          const riskContingencyPercent = costConfig.riskContingencyPercent || 0;
          const pmGeneralsPercent = costConfig.pmGeneralsPercent || 0;

          const overheadsCost = baseCost / (1 - (overheadsPercent / 100)) - baseCost;
          const performanceBondCost = baseCost * (performanceBondPercent / 100);
          const insuranceCost = baseCost * (insurancePercent / 100);
          const warrantyCost = baseCost * (warrantyPercent / 100);
          const riskContingencyCost = baseCost * (riskContingencyPercent / 100);
          const pmGeneralsCost = baseCost * (pmGeneralsPercent / 100);

          const subtotalBeforeProfit = baseCost + overheadsCost + performanceBondCost + insuranceCost + warrantyCost + riskContingencyCost + pmGeneralsCost;

          // Budget = Total COST (excluding profit which is margin, not a cost)
          const totalCost = subtotalBeforeProfit;

          // Store all indirect costs in overhead_total (supervision + overheads + bonds + insurance + warranty + contingencies + PM/generals)
          const totalIndirectCosts = supervisionTotal + overheadsCost + performanceBondCost + insuranceCost + warrantyCost + riskContingencyCost + pmGeneralsCost;

          estimationData = {
            calculated_value: totalCost,
            labor_total: laborTotal,
            materials_total: materialsTotal,
            equipment_total: equipmentTotal,
            subcontractor_total: subcontractorTotal,
            overhead_total: totalIndirectCosts,
            assets_total: 0
          };
        } else {
          const projectData = estimate.project_data || {};
          const costConfig = projectData.costConfig || {};

          const laborLibraryMap = new Map(
            (projectData.laborLibrary || []).map((l: any) => [l.id, l])
          );

          const laborTotal = (projectData.manpowerItems || []).reduce((sum: number, item: any) => {
            const laborType = laborLibraryMap.get(item.laborTypeId);
            if (!laborType) return sum;
            const hourlyRate = laborType.hourlyRate || 0;
            const hours = item.estimatedHours || 0;
            const mobilization = item.mobilizationCost || 0;
            const demobilization = item.demobilizationCost || 0;
            return sum + (hours * hourlyRate) + mobilization + demobilization;
          }, 0);

          const assetsTotal = (projectData.assets || []).reduce((sum: number, asset: any) => {
            const quantity = asset.quantity || 0;
            const unitCost = asset.unitCost || 0;
            const removalCost = (asset.removalCostPerUnit || 0) * quantity;
            return sum + (quantity * unitCost) + removalCost;
          }, 0);

          const materialsTotal = (projectData.materialsCatalog || []).reduce((sum: number, m: any) =>
            sum + ((m.quantity || 0) * (m.unitCost || 0)), 0
          );

          const equipmentTotal = (projectData.logisticsItems || []).reduce((sum: number, l: any) =>
            sum + ((l.quantity || 0) * (l.unitCost || 0)), 0
          );

          const subcontractorTotal = (projectData.subcontractors || []).reduce((sum: number, s: any) => {
            const totalCost = (s.unitCost || 0) * (s.quantity || 0);
            return sum + totalCost;
          }, 0);

          const supervisionTotal = (projectData.supervisionRoles || []).reduce((sum: number, role: any) => {
            const laborType = laborLibraryMap.get(role.laborTypeId);
            if (!laborType) return sum;
            const monthlySalary = laborType.monthlySalary || 0;
            const months = role.durationMonths || 0;
            return sum + (monthlySalary * months);
          }, 0);

          const baseCost = laborTotal + assetsTotal + materialsTotal + equipmentTotal + subcontractorTotal + supervisionTotal;

          // Calculate all markup costs matching the retrofit calculation logic
          const overheadsPercent = costConfig.overheadsPercent || 0;
          const performanceBondPercent = costConfig.performanceBondPercent || 0;
          const insurancePercent = costConfig.insurancePercent || 0;
          const warrantyPercent = costConfig.warrantyPercent || 0;
          const profitPercent = costConfig.profitPercent || 0;
          const riskContingencyPercent = costConfig.riskContingencyPercent || 0;
          const pmGeneralsPercent = costConfig.pmGeneralsPercent || 0;

          const overheadsCost = baseCost / (1 - (overheadsPercent / 100)) - baseCost;
          const performanceBondCost = baseCost * (performanceBondPercent / 100);
          const insuranceCost = baseCost * (insurancePercent / 100);
          const warrantyCost = baseCost * (warrantyPercent / 100);
          const riskContingencyCost = baseCost * (riskContingencyPercent / 100);
          const pmGeneralsCost = baseCost * (pmGeneralsPercent / 100);

          const subtotalBeforeProfit = baseCost + overheadsCost + performanceBondCost + insuranceCost + warrantyCost + riskContingencyCost + pmGeneralsCost;

          // Budget = Total COST (excluding profit which is margin, not a cost)
          const totalCost = subtotalBeforeProfit;

          // Store all indirect costs in overhead_total (supervision + overheads + bonds + insurance + warranty + contingencies + PM/generals)
          const totalIndirectCosts = supervisionTotal + overheadsCost + performanceBondCost + insuranceCost + warrantyCost + riskContingencyCost + pmGeneralsCost;

          estimationData = {
            calculated_value: totalCost,
            labor_total: laborTotal,
            materials_total: materialsTotal,
            equipment_total: equipmentTotal,
            subcontractor_total: subcontractorTotal,
            overhead_total: totalIndirectCosts,
            assets_total: assetsTotal
          };
        }

        await importBudgetFromEstimation(projectId, estimationData);
        await loadBudgetData();
        onBudgetImported?.();
        onClose();
      } catch (error) {
        console.error('Error importing budget:', error);
        alert('Failed to import budget: ' + (error as Error).message);
      } finally {
        setImporting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-semibold">Import Budget from Estimation</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Estimation Project
              </label>
              <select
                value={selectedEstimate}
                onChange={(e) => setSelectedEstimate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Choose estimation...</option>
                {estimates.map(est => (
                  <option key={est.id} value={est.id}>
                    {est.project_name} - {formatCurrency(est.calculated_value || 0, currency)}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                This will create a budget baseline based on the selected estimation project's calculated values.
                A 10% contingency will be automatically added.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedEstimate || importing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : 'Import Budget'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ChangeOrderModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      reason: '',
      requested_budget_change: 0,
      impact_analysis: ''
    });
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
      if (!formData.title || !baseline) return;

      try {
        setCreating(true);
        await createBudgetChangeOrder({
          project_id: projectId,
          title: formData.title,
          description: formData.description,
          reason: formData.reason,
          current_budget: baseline.total_budget,
          requested_budget_change: formData.requested_budget_change,
          new_total_budget: baseline.total_budget + formData.requested_budget_change,
          impact_analysis: formData.impact_analysis,
          status: 'draft'
        });

        await loadBudgetData();
        onClose();
      } catch (error) {
        console.error('Error creating change order:', error);
        alert('Failed to create change order');
      } finally {
        setCreating(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
            <h3 className="text-lg font-semibold">Create Budget Change Order</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="e.g., Additional Equipment Required"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Describe the change..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <input
                type="text"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Why is this change needed?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget Change Amount *
              </label>
              <input
                type="number"
                value={formData.requested_budget_change}
                onChange={(e) => setFormData({ ...formData, requested_budget_change: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="0.00"
              />
              {baseline && (
                <p className="text-sm text-gray-600 mt-1">
                  Current Budget: {formatCurrency(baseline.total_budget, currency)} →
                  New Budget: {formatCurrency(baseline.total_budget + formData.requested_budget_change, currency)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Impact Analysis
              </label>
              <textarea
                value={formData.impact_analysis}
                onChange={(e) => setFormData({ ...formData, impact_analysis: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Describe the impact on schedule, resources, etc..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-white"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!formData.title || creating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {creating ? 'Creating...' : 'Create Change Order'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EVMDashboard: React.FC = () => {
    if (!evmMetrics) return null;

    const getStatusColor = (value: number, isIndex: boolean = false) => {
      if (isIndex) {
        if (value >= 1) return 'text-green-600';
        if (value >= 0.9) return 'text-yellow-600';
        return 'text-red-600';
      }
      if (value >= 0) return 'text-green-600';
      return 'text-red-600';
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-700 mb-1">Planned Value (PV)</p>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(evmMetrics.planned_value, currency)}</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-700 mb-1">Earned Value (EV)</p>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(evmMetrics.earned_value, currency)}</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-700 mb-1">Actual Cost (AC)</p>
            <p className="text-2xl font-bold text-red-900">{formatCurrency(evmMetrics.actual_cost, currency)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Schedule Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Schedule Variance (SV)</span>
                <span className={`font-medium ${getStatusColor(evmMetrics.schedule_variance)}`}>
                  {formatCurrency(evmMetrics.schedule_variance, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Schedule Performance Index (SPI)</span>
                <span className={`font-medium ${getStatusColor(evmMetrics.schedule_performance_index, true)}`}>
                  {evmMetrics.schedule_performance_index.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Cost Performance</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cost Variance (CV)</span>
                <span className={`font-medium ${getStatusColor(evmMetrics.cost_variance)}`}>
                  {formatCurrency(evmMetrics.cost_variance, currency)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Cost Performance Index (CPI)</span>
                <span className={`font-medium ${getStatusColor(evmMetrics.cost_performance_index, true)}`}>
                  {evmMetrics.cost_performance_index.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Forecasting</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Estimate at Completion (EAC)</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(evmMetrics.estimate_at_completion, currency)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Estimate to Complete (ETC)</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(evmMetrics.estimate_to_complete, currency)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Variance at Completion (VAC)</p>
              <p className={`text-xl font-bold ${getStatusColor(evmMetrics.variance_at_completion)}`}>
                {formatCurrency(evmMetrics.variance_at_completion, currency)}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">To-Complete Performance Index (TCPI)</span>
              <span className={`text-lg font-bold ${getStatusColor(evmMetrics.to_complete_performance_index, true)}`}>
                {evmMetrics.to_complete_performance_index.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Required CPI to meet budget: {evmMetrics.to_complete_performance_index < 1 ? 'On track' : 'Requires improvement'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Loading budget data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => setActiveView('overview')}
          className={`px-4 py-2 font-medium ${
            activeView === 'overview' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveView('evm')}
          className={`px-4 py-2 font-medium ${
            activeView === 'evm' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
          }`}
        >
          EVM Analysis
        </button>
        <button
          onClick={() => setActiveView('change-orders')}
          className={`px-4 py-2 font-medium ${
            activeView === 'change-orders' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
          }`}
        >
          Change Orders
        </button>
      </div>

      {activeView === 'overview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Budget Overview</h3>
            <div className="flex gap-2">
              {!baseline && (
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4" />
                  Import Budget
                </button>
              )}
              {baseline && (
                <>
                  <button
                    onClick={() => setShowChangeOrderModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Change Order
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Budget
                  </button>
                </>
              )}
            </div>
          </div>

          {!baseline ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Baseline</h3>
              <p className="text-gray-600 mb-4">Import a budget from an estimation to get started</p>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                Import Budget
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-700">Total Budget</p>
                  <p className="text-2xl font-bold text-blue-900">{formatCurrency(baseline.total_budget, currency)}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-700">Assets</p>
                  <p className="text-2xl font-bold text-green-900">{formatCurrency(baseline.assets_budget, currency)}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-orange-700">Labor</p>
                  <p className="text-2xl font-bold text-orange-900">{formatCurrency(baseline.labor_budget, currency)}</p>
                </div>
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-pink-700">Materials</p>
                  <p className="text-2xl font-bold text-pink-900">{formatCurrency(baseline.materials_budget, currency)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-cyan-700">Equipment</p>
                  <p className="text-2xl font-bold text-cyan-900">{formatCurrency(baseline.equipment_budget, currency)}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-700">Subcontractor</p>
                  <p className="text-2xl font-bold text-amber-900">{formatCurrency(baseline.subcontractor_budget, currency)}</p>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-teal-700">Overhead</p>
                  <p className="text-2xl font-bold text-teal-900">{formatCurrency(baseline.overhead_budget, currency)}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-700">Contingency</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(baseline.contingency_budget, currency)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'evm' && <EVMDashboard />}

      {activeView === 'change-orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Change Orders</h3>
            <button
              onClick={() => setShowChangeOrderModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Change Order
            </button>
          </div>

          {changeOrders.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No change orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {changeOrders.map(co => (
                <div key={co.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{co.change_order_number}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          co.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                          co.status === 'pending_review' ? 'bg-yellow-100 text-yellow-700' :
                          co.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {co.status}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{co.title}</p>
                      <p className="text-sm text-gray-600">{co.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-gray-600">
                          Change: <span className={co.requested_budget_change >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                            {formatCurrency(Math.abs(co.requested_budget_change), currency)}
                          </span>
                        </span>
                        <span className="text-gray-600">
                          New Total: <span className="font-medium">{formatCurrency(co.new_total_budget, currency)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showImportModal && <ImportBudgetModal onClose={() => setShowImportModal(false)} />}
      {showChangeOrderModal && <ChangeOrderModal onClose={() => setShowChangeOrderModal(false)} />}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Delete Budget Baseline</h3>
              </div>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Are you sure you want to delete this budget baseline? This action cannot be undone.
                  All budget data, allocations, and forecasts will be removed.
                </p>
              </div>

              {baseline && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Budget to Delete
                  </label>
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
                    Total Budget: {formatCurrency(baseline.total_budget, currency)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-slate-50">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBudget}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
