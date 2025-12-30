import { useState, useEffect } from 'react';
import { Save, FolderOpen, Trash2, Copy, X, Search, GitCompare, Tag } from 'lucide-react';
import { saveProject, updateProject, loadProjects, deleteProject, duplicateProject, changeProjectStatus, type SavedProject } from '../../utils/fmDatabase';
import type { FMEstimatorState } from '../../types/fm';
import type { ProjectStatus } from '../../types/projectStatus';
import { StatusBadge } from '../StatusBadge';
import { StatusChangeModal } from '../StatusChangeModal';
import { usePermissions } from '../../hooks/usePermissions';

interface ProjectManagerProps {
  currentState: FMEstimatorState;
  onLoadProject: (state: FMEstimatorState, projectId: string, projectName: string) => void;
  currentProjectId: string | null;
  currentProjectName: string;
  onProjectNameChange: (name: string) => void;
}

export default function ProjectManager({
  currentState,
  onLoadProject,
  currentProjectId,
  currentProjectName,
  onProjectNameChange,
}: ProjectManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showComparison, setShowComparison] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [statusChangeProject, setStatusChangeProject] = useState<SavedProject | null>(null);
  const { isAdmin } = usePermissions();

  const refreshProjects = async () => {
    setLoading(true);
    const result = await loadProjects();
    if (result.success && result.projects) {
      setProjects(result.projects);
    } else if (result.error) {
      alert(`Failed to load projects: ${result.error}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (showModal) {
      refreshProjects();
    }
  }, [showModal]);

  const handleSave = async () => {
    if (!currentProjectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    setSaveLoading(true);
    let result;

    if (currentProjectId) {
      result = await updateProject(currentProjectId, currentProjectName, currentState);
    } else {
      result = await saveProject(currentProjectName, currentState);
      if (result.success && result.projectId) {
        onProjectNameChange(currentProjectName);
        onLoadProject(currentState, result.projectId, currentProjectName);
      }
    }

    if (result.success) {
      alert(currentProjectId ? 'Project updated successfully!' : 'Project saved successfully!');
      refreshProjects();
    } else {
      alert(`Failed to save project: ${result.error}`);
    }
    setSaveLoading(false);
  };

  const handleLoad = (project: SavedProject) => {
    if (confirm(`Load project "${project.project_name}"? Any unsaved changes will be lost.`)) {
      onLoadProject(project.project_data, project.id, project.project_name);
      setShowModal(false);
    }
  };

  const handleDelete = async (projectId: string, projectName: string) => {
    if (confirm(`Delete project "${projectName}"? This cannot be undone.`)) {
      const result = await deleteProject(projectId);
      if (result.success) {
        alert('Project deleted successfully!');
        refreshProjects();
        if (currentProjectId === projectId) {
          onLoadProject(currentState, null, 'Untitled Project');
        }
      } else {
        alert(`Failed to delete project: ${result.error}`);
      }
    }
  };

  const handleDuplicate = async (projectId: string, projectName: string) => {
    const newName = prompt(`Enter name for duplicated project:`, `${projectName} (Copy)`);
    if (newName && newName.trim()) {
      const result = await duplicateProject(projectId, newName.trim());
      if (result.success) {
        alert('Project duplicated successfully!');
        refreshProjects();
      } else {
        alert(`Failed to duplicate project: ${result.error}`);
      }
    }
  };

  const handleComparisonToggle = (projectId: string) => {
    setSelectedProjects((prev) => {
      if (prev.includes(projectId)) {
        return prev.filter((id) => id !== projectId);
      } else if (prev.length < 2) {
        return [...prev, projectId];
      }
      return prev;
    });
  };

  const filteredProjects = projects.filter((project) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      project.project_name.toLowerCase().includes(searchLower) ||
      project.project_data.projectInfo?.projectLocation?.toLowerCase().includes(searchLower) ||
      project.project_data.projectInfo?.projectType?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={currentProjectName}
          onChange={(e) => onProjectNameChange(e.target.value)}
          placeholder="Project Name"
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={handleSave}
          disabled={saveLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saveLoading ? 'Saving...' : currentProjectId ? 'Update' : 'Save'}
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
        >
          <FolderOpen className="w-5 h-5" />
          Load
        </button>
        <button
          onClick={() => { setShowModal(true); setShowComparison(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
          title="Compare Projects"
        >
          <GitCompare className="w-5 h-5" />
          Compare
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {showComparison ? 'Compare Projects' : 'My Projects'}
                </h2>
                {showComparison && (
                  <p className="text-sm text-gray-600 mt-1">
                    Select 2 projects to compare (Selected: {selectedProjects.length}/2)
                  </p>
                )}
              </div>
              <button
                onClick={() => { setShowModal(false); setShowComparison(false); setSelectedProjects([]); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by project name, location, or type..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-250px)]">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading projects...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No projects match your search.' : 'No saved projects yet. Save your first project to get started!'}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className={`flex items-center justify-between p-4 border-2 rounded-lg transition-colors ${
                        selectedProjects.includes(project.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {showComparison && (
                            <input
                              type="checkbox"
                              checked={selectedProjects.includes(project.id)}
                              onChange={() => handleComparisonToggle(project.id)}
                              disabled={!selectedProjects.includes(project.id) && selectedProjects.length >= 2}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-800">{project.project_name}</h3>
                              <StatusBadge status={project.status} />
                            </div>
                            <div className="flex gap-4 text-sm text-gray-500">
                              {project.project_data.projectInfo?.projectLocation && (
                                <span>📍 {project.project_data.projectInfo.projectLocation}</span>
                              )}
                              {project.project_data.projectInfo?.projectType && (
                                <span>🏢 {project.project_data.projectInfo.projectType}</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Updated: {new Date(project.updated_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      {!showComparison && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setStatusChangeProject(project)}
                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Change Status"
                          >
                            <Tag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleLoad(project)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDuplicate(project.id, project.project_name)}
                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(project.id, project.project_name)}
                            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {showComparison && selectedProjects.length === 2 && (
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    const [proj1, proj2] = selectedProjects.map(id => projects.find(p => p.id === id)!);
                    setShowModal(false);
                    setTimeout(() => {
                      const comparisonWindow = window.open('', '_blank', 'width=1200,height=800');
                      if (comparisonWindow) {
                        comparisonWindow.document.write(generateComparisonHTML(proj1, proj2));
                      }
                    }, 100);
                  }}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  View Comparison
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {statusChangeProject && (
        <StatusChangeModal
          projectName={statusChangeProject.project_name}
          currentStatus={statusChangeProject.status}
          statusHistory={statusChangeProject.status_history || []}
          isAdmin={isAdmin}
          onClose={() => setStatusChangeProject(null)}
          onStatusChange={async (newStatus: ProjectStatus) => {
            const result = await changeProjectStatus(statusChangeProject.id, newStatus);
            if (result.success) {
              await refreshProjects();
              setStatusChangeProject(null);
            } else {
              throw new Error(result.error || 'Failed to change status');
            }
          }}
        />
      )}
    </>
  );
}

function generateComparisonHTML(proj1: SavedProject, proj2: SavedProject): string {
  const formatCurrency = (value: number) => value.toLocaleString('en-AE', { minimumFractionDigits: 0 });

  const calculateFMResults = (state: any) => {
    const workingHoursPerYear = state.globalAssumptions.workingDaysPerYear * state.globalAssumptions.effectiveHours;

    let totalInHouseAnnualHours = 0;
    state.assetInventory.forEach((inv: any) => {
      const assetType = state.assetTypes.find((a: any) => a.id === inv.assetTypeId);
      if (!assetType) return;
      if (assetType.responsibility !== 'in_house') return;

      assetType.ppmTasks.forEach((task: any) => {
        const freqMultipliers: any = { daily: 365, weekly: 52, monthly: 12, quarterly: 4, semiannual: 2, annual: 1 };
        const annualVisits = freqMultipliers[task.frequency] || 1;
        totalInHouseAnnualHours += task.hoursPerVisit * annualVisits * inv.quantity;
      });

      const estimatedReactiveCalls = (assetType.reactive.reactiveCallsPercent / 100) * inv.quantity;
      totalInHouseAnnualHours += estimatedReactiveCalls * assetType.reactive.avgHoursPerCall;
    });

    const activeFTE = totalInHouseAnnualHours / workingHoursPerYear;
    const totalWithRelievers = activeFTE * state.globalAssumptions.coverageFactor;

    let totalManpowerAnnual = 0;
    state.technicianLibrary.forEach((tech: any) => {
      const monthlyCost = tech.monthlySalary + tech.additionalCost + (tech.expectedOvertimeHoursPerMonth * (tech.monthlySalary / 173) * state.globalAssumptions.overtimeMultiplier);
      totalManpowerAnnual += monthlyCost * 12;
    });

    const materialsAnnual = state.materialsCatalog.filter((m: any) => m.included).reduce((sum: number, m: any) => sum + (m.unitRate * m.expectedAnnualQty), 0);
    const consumablesAnnual = state.consumablesCatalog.filter((c: any) => c.included).reduce((sum: number, c: any) => sum + (c.unitRate * c.expectedAnnualQty), 0);

    const inHouseBase = totalManpowerAnnual + materialsAnnual + consumablesAnnual;
    const inHouseOverheads = inHouseBase * (state.costConfig.inHouse.overheadsPercent / 100);
    const inHouseSubtotal = inHouseBase + inHouseOverheads;
    const inHouseProfit = inHouseSubtotal * (state.costConfig.inHouse.markupPercent / 100);
    const inHouseSelling = inHouseSubtotal + inHouseProfit;

    let subcontractBase = 0;
    state.assetInventory.forEach((inv: any) => {
      const assetType = state.assetTypes.find((a: any) => a.id === inv.assetTypeId);
      if (assetType?.responsibility === 'subcontract' && inv.unitSubcontractCost) {
        subcontractBase += inv.unitSubcontractCost * inv.quantity * 12;
      }
    });
    state.specializedServices.forEach((svc: any) => {
      const freqMultipliers: any = { daily: 365, weekly: 52, monthly: 12, quarterly: 4, semiannual: 2, annual: 1 };
      const annualVisits = freqMultipliers[svc.frequency] || 1;
      if (svc.pricingMode === 'per_asset' && svc.unitCost) {
        subcontractBase += svc.unitCost * svc.qty * annualVisits;
      } else if (svc.pricingMode === 'lump_sum' && svc.monthlyCost) {
        subcontractBase += svc.monthlyCost * 12;
      }
    });

    const subcontractOverheads = subcontractBase * (state.costConfig.subcontract.overheadsPercent / 100);
    const subcontractSubtotal = subcontractBase + subcontractOverheads;
    const subcontractProfit = subcontractSubtotal * (state.costConfig.subcontract.markupPercent / 100);
    const subcontractSelling = subcontractSubtotal + subcontractProfit;

    const grandTotal = inHouseSelling + subcontractSelling;

    return {
      totalInHouseAnnualHours,
      activeFTE,
      totalWithRelievers,
      totalManpowerAnnual,
      materialsAnnual,
      consumablesAnnual,
      inHouseSelling,
      subcontractSelling,
      grandTotal
    };
  };

  const results1 = calculateFMResults(proj1.project_data);
  const results2 = calculateFMResults(proj2.project_data);

  const highlightBetter = (val1: number, val2: number, lowerIsBetter: boolean) => {
    if (lowerIsBetter) {
      return val1 < val2 ? ' class="highlight-better"' : '';
    }
    return val1 > val2 ? ' class="highlight-better"' : '';
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Project Comparison</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          max-width: 1400px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
          text-align: center;
          color: #1f2937;
          margin-bottom: 30px;
        }
        .comparison-grid {
          display: grid;
          grid-template-columns: 300px 1fr 1fr;
          gap: 2px;
          background: #e5e7eb;
          border: 2px solid #e5e7eb;
        }
        .header {
          background: #8b5cf6;
          color: white;
          padding: 15px;
          font-weight: bold;
          text-align: center;
        }
        .label {
          background: #f3f4f6;
          padding: 12px;
          font-weight: 600;
          color: #374151;
        }
        .value {
          background: white;
          padding: 12px;
          color: #1f2937;
        }
        .section-header {
          background: #6366f1;
          color: white;
          padding: 12px;
          font-weight: bold;
          grid-column: 1 / -1;
        }
        .highlight-better {
          background: #d1fae5 !important;
          font-weight: 600;
        }
        @media print {
          body { background: white; }
          .container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📊 Project Comparison</h1>
        <div class="comparison-grid">
          <div class="header"></div>
          <div class="header">${proj1.project_name}</div>
          <div class="header">${proj2.project_name}</div>

          <div class="section-header">PROJECT INFORMATION</div>

          <div class="label">Location</div>
          <div class="value">${proj1.project_data.projectInfo?.projectLocation || '-'}</div>
          <div class="value">${proj2.project_data.projectInfo?.projectLocation || '-'}</div>

          <div class="label">Type</div>
          <div class="value">${proj1.project_data.projectInfo?.projectType || '-'}</div>
          <div class="value">${proj2.project_data.projectInfo?.projectType || '-'}</div>

          <div class="label">Last Updated</div>
          <div class="value">${new Date(proj1.updated_at).toLocaleString()}</div>
          <div class="value">${new Date(proj2.updated_at).toLocaleString()}</div>

          <div class="section-header">GLOBAL ASSUMPTIONS</div>

          <div class="label">Deployment Model</div>
          <div class="value">${proj1.project_data.globalAssumptions.deploymentModel === 'resident' ? 'Resident' : 'Rotating'}</div>
          <div class="value">${proj2.project_data.globalAssumptions.deploymentModel === 'resident' ? 'Resident' : 'Rotating'}</div>

          <div class="label">Working Days/Year</div>
          <div class="value">${proj1.project_data.globalAssumptions.workingDaysPerYear}</div>
          <div class="value">${proj2.project_data.globalAssumptions.workingDaysPerYear}</div>

          <div class="label">Shift Length</div>
          <div class="value">${proj1.project_data.globalAssumptions.shiftLength}h</div>
          <div class="value">${proj2.project_data.globalAssumptions.shiftLength}h</div>

          <div class="section-header">INVENTORY</div>

          <div class="label">Asset Count</div>
          <div class="value">${proj1.project_data.assetInventory.length}</div>
          <div class="value">${proj2.project_data.assetInventory.length}</div>

          <div class="label">Technician Types</div>
          <div class="value">${proj1.project_data.technicianLibrary.length}</div>
          <div class="value">${proj2.project_data.technicianLibrary.length}</div>

          <div class="label">Materials Items</div>
          <div class="value">${proj1.project_data.materialsCatalog.filter(m => m.included).length}</div>
          <div class="value">${proj2.project_data.materialsCatalog.filter(m => m.included).length}</div>

          <div class="label">Consumables Items</div>
          <div class="value">${proj1.project_data.consumablesCatalog.filter(c => c.included).length}</div>
          <div class="value">${proj2.project_data.consumablesCatalog.filter(c => c.included).length}</div>

          <div class="label">Specialized Services</div>
          <div class="value">${proj1.project_data.specializedServices.length}</div>
          <div class="value">${proj2.project_data.specializedServices.length}</div>

          <div class="section-header">MANPOWER SUMMARY</div>

          <div class="label">Total Annual Hours</div>
          <div class="value">${formatCurrency(results1.totalInHouseAnnualHours)} hrs</div>
          <div class="value">${formatCurrency(results2.totalInHouseAnnualHours)} hrs</div>

          <div class="label">Active FTE</div>
          <div class="value">${results1.activeFTE.toFixed(2)}</div>
          <div class="value">${results2.activeFTE.toFixed(2)}</div>

          <div class="label">Total w/ Relievers</div>
          <div class="value">${results1.totalWithRelievers.toFixed(2)}</div>
          <div class="value">${results2.totalWithRelievers.toFixed(2)}</div>

          <div class="section-header">COST BREAKDOWN</div>

          <div class="label">Manpower Annual (AED)</div>
          <div class="value${highlightBetter(results1.totalManpowerAnnual, results2.totalManpowerAnnual, true)}">${formatCurrency(results1.totalManpowerAnnual)}</div>
          <div class="value${highlightBetter(results2.totalManpowerAnnual, results1.totalManpowerAnnual, true)}">${formatCurrency(results2.totalManpowerAnnual)}</div>

          <div class="label">Materials Annual (AED)</div>
          <div class="value${highlightBetter(results1.materialsAnnual, results2.materialsAnnual, true)}">${formatCurrency(results1.materialsAnnual)}</div>
          <div class="value${highlightBetter(results2.materialsAnnual, results1.materialsAnnual, true)}">${formatCurrency(results2.materialsAnnual)}</div>

          <div class="label">Consumables Annual (AED)</div>
          <div class="value${highlightBetter(results1.consumablesAnnual, results2.consumablesAnnual, true)}">${formatCurrency(results1.consumablesAnnual)}</div>
          <div class="value${highlightBetter(results2.consumablesAnnual, results1.consumablesAnnual, true)}">${formatCurrency(results2.consumablesAnnual)}</div>

          <div class="label">In-House Selling Annual (AED)</div>
          <div class="value${highlightBetter(results1.inHouseSelling, results2.inHouseSelling, true)}">${formatCurrency(results1.inHouseSelling)}</div>
          <div class="value${highlightBetter(results2.inHouseSelling, results1.inHouseSelling, true)}">${formatCurrency(results2.inHouseSelling)}</div>

          <div class="label">In-House Selling Monthly (AED)</div>
          <div class="value${highlightBetter(results1.inHouseSelling / 12, results2.inHouseSelling / 12, true)}">${formatCurrency(results1.inHouseSelling / 12)}</div>
          <div class="value${highlightBetter(results2.inHouseSelling / 12, results1.inHouseSelling / 12, true)}">${formatCurrency(results2.inHouseSelling / 12)}</div>

          <div class="label">Subcontract Selling Annual (AED)</div>
          <div class="value${highlightBetter(results1.subcontractSelling, results2.subcontractSelling, true)}">${formatCurrency(results1.subcontractSelling)}</div>
          <div class="value${highlightBetter(results2.subcontractSelling, results1.subcontractSelling, true)}">${formatCurrency(results2.subcontractSelling)}</div>

          <div class="label">Subcontract Selling Monthly (AED)</div>
          <div class="value${highlightBetter(results1.subcontractSelling / 12, results2.subcontractSelling / 12, true)}">${formatCurrency(results1.subcontractSelling / 12)}</div>
          <div class="value${highlightBetter(results2.subcontractSelling / 12, results1.subcontractSelling / 12, true)}">${formatCurrency(results2.subcontractSelling / 12)}</div>

          <div class="section-header" style="background: #f59e0b; font-size: 14px;">TOTAL SELLING PRICE</div>

          <div class="label" style="font-weight: bold; font-size: 14px;">Grand Total Annual (AED)</div>
          <div class="value${highlightBetter(results1.grandTotal, results2.grandTotal, true)}" style="font-weight: bold; font-size: 14px;">${formatCurrency(results1.grandTotal)}</div>
          <div class="value${highlightBetter(results2.grandTotal, results1.grandTotal, true)}" style="font-weight: bold; font-size: 14px;">${formatCurrency(results2.grandTotal)}</div>

          <div class="label" style="font-weight: bold; font-size: 14px;">Grand Total Monthly (AED)</div>
          <div class="value${highlightBetter(results1.grandTotal / 12, results2.grandTotal / 12, true)}" style="font-weight: bold; font-size: 14px;">${formatCurrency(results1.grandTotal / 12)}</div>
          <div class="value${highlightBetter(results2.grandTotal / 12, results1.grandTotal / 12, true)}" style="font-weight: bold; font-size: 14px;">${formatCurrency(results2.grandTotal / 12)}</div>

          <div class="section-header">PRICE DIFFERENCE</div>

          <div class="label">Annual Difference (AED)</div>
          <div class="value" style="grid-column: 2 / -1; text-align: center; font-weight: bold;">${formatCurrency(Math.abs(results1.grandTotal - results2.grandTotal))}</div>

          <div class="label">Percentage Difference</div>
          <div class="value" style="grid-column: 2 / -1; text-align: center; font-weight: bold;">${((Math.abs(results1.grandTotal - results2.grandTotal) / Math.max(results1.grandTotal, results2.grandTotal)) * 100).toFixed(2)}%</div>

          <div class="label">Lower Cost Project</div>
          <div class="value" style="grid-column: 2 / -1; text-align: center; font-weight: bold; color: #10b981;">${results1.grandTotal < results2.grandTotal ? proj1.project_name : proj2.project_name}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}
