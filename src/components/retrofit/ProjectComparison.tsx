import React, { useState } from 'react';
import { X, GitCompare } from 'lucide-react';
import { SavedRetrofitProject } from '../../utils/retrofitDatabase';
import { calculateRetrofitResults } from '../../utils/retrofitCalculations';

interface ProjectComparisonProps {
  projects: SavedRetrofitProject[];
  onClose: () => void;
}

export function ProjectComparison({ projects, onClose }: ProjectComparisonProps) {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const handleToggleProject = (projectId: string) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else if (prev.length < 2) {
        return [...prev, projectId];
      }
      return prev;
    });
  };

  const handleViewComparison = () => {
    if (selectedProjects.length !== 2) return;

    const proj1 = projects.find((p) => p.id === selectedProjects[0])!;
    const proj2 = projects.find((p) => p.id === selectedProjects[1])!;

    const comparisonWindow = window.open('', '_blank', 'width=1400,height=900');
    if (comparisonWindow) {
      comparisonWindow.document.write(generateComparisonHTML(proj1, proj2));
      comparisonWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Compare Projects</h2>
            <p className="text-sm text-gray-600 mt-1">
              Select 2 projects to compare (Selected: {selectedProjects.length}/2)
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No saved projects available for comparison.
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors cursor-pointer ${
                    selectedProjects.includes(project.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleToggleProject(project.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={() => handleToggleProject(project.id)}
                      disabled={!selectedProjects.includes(project.id) && selectedProjects.length >= 2}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-800">{project.project_name}</h3>
                      <div className="flex gap-4 text-sm text-gray-500 mt-1">
                        {project.project_data.projectInfo?.projectLocation && (
                          <span>📍 {project.project_data.projectInfo.projectLocation}</span>
                        )}
                        {project.project_data.projectInfo?.clientName && (
                          <span>👤 {project.project_data.projectInfo.clientName}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Updated: {new Date(project.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProjects.length === 2 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleViewComparison}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2"
            >
              <GitCompare className="w-5 h-5" />
              View Comparison
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function generateComparisonHTML(proj1: SavedRetrofitProject, proj2: SavedRetrofitProject): string {
  const formatCurrency = (value: number) => `AED ${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
  const formatNumber = (value: number) => value.toLocaleString('en-US');

  const results1 = calculateRetrofitResults(proj1.project_data);
  const results2 = calculateRetrofitResults(proj2.project_data);

  const highlightBetter = (val1: number, val2: number, lowerIsBetter = true) => {
    if (lowerIsBetter) {
      return val1 < val2 ? ' class="better"' : val1 > val2 ? ' class="worse"' : '';
    }
    return val1 > val2 ? ' class="better"' : val1 < val2 ? ' class="worse"' : '';
  };

  const diff = (val1: number, val2: number) => {
    const diffVal = val1 - val2;
    const diffPercent = val2 !== 0 ? ((diffVal / val2) * 100).toFixed(1) : '0.0';
    const sign = diffVal > 0 ? '+' : '';
    return `${sign}${formatCurrency(diffVal)} (${sign}${diffPercent}%)`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Retrofit Project Comparison</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
          padding: 30px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          color: #333;
        }
        .container {
          max-width: 1400px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #ea580c 0%, #fb923c 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .header p {
          font-size: 14px;
          opacity: 0.9;
        }
        .project-headers {
          display: grid;
          grid-template-columns: 300px 1fr 1fr;
          gap: 20px;
          padding: 20px 30px;
          background: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }
        .project-header {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .project-header h2 {
          font-size: 20px;
          font-weight: bold;
          color: #ea580c;
          margin-bottom: 12px;
        }
        .project-info {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 6px;
        }
        .project-info strong {
          color: #334155;
          display: inline-block;
          width: 80px;
        }
        .comparison-table {
          padding: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .section-header {
          background: linear-gradient(90deg, #1e293b 0%, #475569 100%);
          color: white;
          padding: 12px 15px;
          font-weight: bold;
          font-size: 16px;
          text-align: left;
        }
        th {
          background: #f1f5f9;
          padding: 12px 15px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 2px solid #cbd5e1;
        }
        th:first-child {
          width: 300px;
        }
        td {
          padding: 12px 15px;
          border-bottom: 1px solid #e2e8f0;
        }
        tr:hover {
          background: #f8fafc;
        }
        .metric-label {
          font-weight: 500;
          color: #334155;
        }
        .value {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          text-align: right;
          color: #1e293b;
        }
        .better {
          background: #d1fae5;
          color: #065f46;
          font-weight: bold;
          padding: 8px 12px;
          border-radius: 4px;
        }
        .worse {
          background: #fee2e2;
          color: #991b1b;
          font-weight: bold;
          padding: 8px 12px;
          border-radius: 4px;
        }
        .difference {
          text-align: center;
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }
        .grand-total-row td {
          background: #fef3c7;
          font-weight: bold;
          font-size: 16px;
          padding: 16px 15px;
          border-top: 3px solid #f59e0b;
          border-bottom: 3px solid #f59e0b;
        }
        .summary-box {
          margin: 20px 30px;
          padding: 20px;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-radius: 8px;
          border-left: 4px solid #3b82f6;
        }
        .summary-box h3 {
          color: #1e40af;
          margin-bottom: 12px;
          font-size: 18px;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .summary-item {
          background: white;
          padding: 12px;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .summary-item strong {
          display: block;
          color: #64748b;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .summary-item span {
          font-size: 18px;
          font-weight: bold;
          color: #1e293b;
        }
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .container {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔄 Retrofit Project Comparison</h1>
          <p>Side-by-side analysis of project costs and metrics</p>
        </div>

        <div class="project-headers">
          <div></div>
          <div class="project-header">
            <h2>${proj1.project_name}</h2>
            <div class="project-info"><strong>Location:</strong> ${proj1.project_data.projectInfo.projectLocation || 'N/A'}</div>
            <div class="project-info"><strong>Client:</strong> ${proj1.project_data.projectInfo.clientName || 'N/A'}</div>
            <div class="project-info"><strong>Duration:</strong> ${results1.projectDurationDays} days</div>
            <div class="project-info"><strong>Updated:</strong> ${new Date(proj1.updated_at).toLocaleDateString()}</div>
          </div>
          <div class="project-header">
            <h2>${proj2.project_name}</h2>
            <div class="project-info"><strong>Location:</strong> ${proj2.project_data.projectInfo.projectLocation || 'N/A'}</div>
            <div class="project-info"><strong>Client:</strong> ${proj2.project_data.projectInfo.clientName || 'N/A'}</div>
            <div class="project-info"><strong>Duration:</strong> ${results2.projectDurationDays} days</div>
            <div class="project-info"><strong>Updated:</strong> ${new Date(proj2.updated_at).toLocaleDateString()}</div>
          </div>
        </div>

        <div class="comparison-table">
          <table>
            <thead>
              <tr class="section-header">
                <th colspan="4">PROJECT OVERVIEW</th>
              </tr>
              <tr>
                <th>Metric</th>
                <th>${proj1.project_name}</th>
                <th>${proj2.project_name}</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="metric-label">Project Duration</td>
                <td class="value"${highlightBetter(results1.projectDurationDays, results2.projectDurationDays)}>${formatNumber(results1.projectDurationDays)} days</td>
                <td class="value"${highlightBetter(results2.projectDurationDays, results1.projectDurationDays)}>${formatNumber(results2.projectDurationDays)} days</td>
                <td class="difference">${results1.projectDurationDays - results2.projectDurationDays} days</td>
              </tr>
              <tr>
                <td class="metric-label">Total Manpower Hours</td>
                <td class="value">${formatNumber(results1.totalManpowerHours)} hrs</td>
                <td class="value">${formatNumber(results2.totalManpowerHours)} hrs</td>
                <td class="difference">${formatNumber(results1.totalManpowerHours - results2.totalManpowerHours)} hrs</td>
              </tr>
              <tr>
                <td class="metric-label">Total Assets</td>
                <td class="value">${formatNumber(results1.totalAssetQuantity)} units</td>
                <td class="value">${formatNumber(results2.totalAssetQuantity)} units</td>
                <td class="difference">${formatNumber(results1.totalAssetQuantity - results2.totalAssetQuantity)} units</td>
              </tr>
              <tr>
                <td class="metric-label">Number of Phases</td>
                <td class="value">${proj1.project_data.projectPhases.length}</td>
                <td class="value">${proj2.project_data.projectPhases.length}</td>
                <td class="difference">${proj1.project_data.projectPhases.length - proj2.project_data.projectPhases.length}</td>
              </tr>
            </tbody>
          </table>

          <table>
            <thead>
              <tr class="section-header">
                <th colspan="4">DIRECT COSTS</th>
              </tr>
              <tr>
                <th>Cost Category</th>
                <th>${proj1.project_name}</th>
                <th>${proj2.project_name}</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="metric-label">Manpower Cost</td>
                <td class="value"${highlightBetter(results1.totalManpowerCost, results2.totalManpowerCost)}>${formatCurrency(results1.totalManpowerCost)}</td>
                <td class="value"${highlightBetter(results2.totalManpowerCost, results1.totalManpowerCost)}>${formatCurrency(results2.totalManpowerCost)}</td>
                <td class="difference">${diff(results1.totalManpowerCost, results2.totalManpowerCost)}</td>
              </tr>
              <tr>
                <td class="metric-label">Assets Cost</td>
                <td class="value"${highlightBetter(results1.totalAssetCost, results2.totalAssetCost)}>${formatCurrency(results1.totalAssetCost)}</td>
                <td class="value"${highlightBetter(results2.totalAssetCost, results1.totalAssetCost)}>${formatCurrency(results2.totalAssetCost)}</td>
                <td class="difference">${diff(results1.totalAssetCost, results2.totalAssetCost)}</td>
              </tr>
              <tr>
                <td class="metric-label">Removal Cost</td>
                <td class="value"${highlightBetter(results1.totalRemovalCost, results2.totalRemovalCost)}>${formatCurrency(results1.totalRemovalCost)}</td>
                <td class="value"${highlightBetter(results2.totalRemovalCost, results1.totalRemovalCost)}>${formatCurrency(results2.totalRemovalCost)}</td>
                <td class="difference">${diff(results1.totalRemovalCost, results2.totalRemovalCost)}</td>
              </tr>
              <tr>
                <td class="metric-label">Subcontractors Cost</td>
                <td class="value"${highlightBetter(results1.totalSubcontractorCost, results2.totalSubcontractorCost)}>${formatCurrency(results1.totalSubcontractorCost)}</td>
                <td class="value"${highlightBetter(results2.totalSubcontractorCost, results1.totalSubcontractorCost)}>${formatCurrency(results2.totalSubcontractorCost)}</td>
                <td class="difference">${diff(results1.totalSubcontractorCost, results2.totalSubcontractorCost)}</td>
              </tr>
              <tr>
                <td class="metric-label">Logistics Cost</td>
                <td class="value"${highlightBetter(results1.totalLogisticsCost, results2.totalLogisticsCost)}>${formatCurrency(results1.totalLogisticsCost)}</td>
                <td class="value"${highlightBetter(results2.totalLogisticsCost, results1.totalLogisticsCost)}>${formatCurrency(results2.totalLogisticsCost)}</td>
                <td class="difference">${diff(results1.totalLogisticsCost, results2.totalLogisticsCost)}</td>
              </tr>
              <tr style="background: #f1f5f9; font-weight: bold;">
                <td class="metric-label">BASE COST</td>
                <td class="value"${highlightBetter(results1.baseCost, results2.baseCost)}>${formatCurrency(results1.baseCost)}</td>
                <td class="value"${highlightBetter(results2.baseCost, results1.baseCost)}>${formatCurrency(results2.baseCost)}</td>
                <td class="difference">${diff(results1.baseCost, results2.baseCost)}</td>
              </tr>
            </tbody>
          </table>

          <table>
            <thead>
              <tr class="section-header">
                <th colspan="4">INDIRECT COSTS & MARGINS</th>
              </tr>
              <tr>
                <th>Item</th>
                <th>${proj1.project_name}</th>
                <th>${proj2.project_name}</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="metric-label">Overheads (${proj1.project_data.costConfig.overheadsPercent}% / ${proj2.project_data.costConfig.overheadsPercent}%)</td>
                <td class="value">${formatCurrency(results1.overheadsCost)}</td>
                <td class="value">${formatCurrency(results2.overheadsCost)}</td>
                <td class="difference">${diff(results1.overheadsCost, results2.overheadsCost)}</td>
              </tr>
              <tr>
                <td class="metric-label">Performance Bond (${proj1.project_data.costConfig.performanceBondPercent}% / ${proj2.project_data.costConfig.performanceBondPercent}%)</td>
                <td class="value">${formatCurrency(results1.performanceBondCost)}</td>
                <td class="value">${formatCurrency(results2.performanceBondCost)}</td>
                <td class="difference">${diff(results1.performanceBondCost, results2.performanceBondCost)}</td>
              </tr>
              <tr>
                <td class="metric-label">Insurance (${proj1.project_data.costConfig.insurancePercent}% / ${proj2.project_data.costConfig.insurancePercent}%)</td>
                <td class="value">${formatCurrency(results1.insuranceCost)}</td>
                <td class="value">${formatCurrency(results2.insuranceCost)}</td>
                <td class="difference">${diff(results1.insuranceCost, results2.insuranceCost)}</td>
              </tr>
              <tr>
                <td class="metric-label">Warranty (${proj1.project_data.costConfig.warrantyPercent}% / ${proj2.project_data.costConfig.warrantyPercent}%)</td>
                <td class="value">${formatCurrency(results1.warrantyCost)}</td>
                <td class="value">${formatCurrency(results2.warrantyCost)}</td>
                <td class="difference">${diff(results1.warrantyCost, results2.warrantyCost)}</td>
              </tr>
              <tr style="background: #f1f5f9; font-weight: bold;">
                <td class="metric-label">SUBTOTAL</td>
                <td class="value">${formatCurrency(results1.subtotalBeforeProfit)}</td>
                <td class="value">${formatCurrency(results2.subtotalBeforeProfit)}</td>
                <td class="difference">${diff(results1.subtotalBeforeProfit, results2.subtotalBeforeProfit)}</td>
              </tr>
              <tr>
                <td class="metric-label">Profit (${proj1.project_data.costConfig.profitPercent}% / ${proj2.project_data.costConfig.profitPercent}%)</td>
                <td class="value">${formatCurrency(results1.profitAmount)}</td>
                <td class="value">${formatCurrency(results2.profitAmount)}</td>
                <td class="difference">${diff(results1.profitAmount, results2.profitAmount)}</td>
              </tr>
              <tr class="grand-total-row">
                <td class="metric-label">GRAND TOTAL</td>
                <td class="value"${highlightBetter(results1.grandTotal, results2.grandTotal)}>${formatCurrency(results1.grandTotal)}</td>
                <td class="value"${highlightBetter(results2.grandTotal, results1.grandTotal)}>${formatCurrency(results2.grandTotal)}</td>
                <td class="difference">${diff(results1.grandTotal, results2.grandTotal)}</td>
              </tr>
              <tr>
                <td class="metric-label">Cost per Asset Unit</td>
                <td class="value"${highlightBetter(results1.costPerAssetUnit, results2.costPerAssetUnit)}>${formatCurrency(results1.costPerAssetUnit)}</td>
                <td class="value"${highlightBetter(results2.costPerAssetUnit, results1.costPerAssetUnit)}>${formatCurrency(results2.costPerAssetUnit)}</td>
                <td class="difference">${diff(results1.costPerAssetUnit, results2.costPerAssetUnit)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="summary-box">
          <h3>📊 Key Insights</h3>
          <div class="summary-grid">
            <div class="summary-item">
              <strong>Total Cost Difference</strong>
              <span>${Math.abs(results1.grandTotal - results2.grandTotal).toLocaleString()} AED (${((Math.abs(results1.grandTotal - results2.grandTotal) / Math.max(results1.grandTotal, results2.grandTotal)) * 100).toFixed(1)}%)</span>
            </div>
            <div class="summary-item">
              <strong>Lower Cost Option</strong>
              <span>${results1.grandTotal < results2.grandTotal ? proj1.project_name : proj2.project_name}</span>
            </div>
            <div class="summary-item">
              <strong>Shorter Duration</strong>
              <span>${results1.projectDurationDays < results2.projectDurationDays ? proj1.project_name : proj2.project_name} (${Math.abs(results1.projectDurationDays - results2.projectDurationDays)} days less)</span>
            </div>
            <div class="summary-item">
              <strong>Best Cost per Unit</strong>
              <span>${results1.costPerAssetUnit < results2.costPerAssetUnit ? proj1.project_name : proj2.project_name}</span>
            </div>
          </div>
        </div>

        <div style="padding: 20px 30px 30px; text-align: center; color: #64748b; font-size: 12px;">
          <p>Generated on ${new Date().toLocaleString()} | Retrofit Project Comparison Tool</p>
          <p style="margin-top: 8px;">💡 Green highlights indicate better (lower) values | Red highlights indicate higher values</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
