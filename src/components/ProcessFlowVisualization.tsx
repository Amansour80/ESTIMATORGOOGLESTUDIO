import { useState, useEffect } from 'react';
import { Edit, Send, Clock, Award, XCircle, Ban, ArrowRight, TrendingUp, ChevronDown, ChevronUp, Layers, Wrench, HardHat, Eye, Trash2, Tag, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { ProjectStatus } from '../types/projectStatus';
import { StatusBadge } from './StatusBadge';
import type { SavedProject } from '../utils/fmDatabase';
import type { SavedRetrofitProject } from '../utils/retrofitDatabase';
import type { SavedHKProject } from '../utils/hkDatabase';

interface ProcessStage {
  id: ProjectStatus;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
}

interface ProcessFlowVisualizationProps {
  onStatusFilter?: (status: ProjectStatus | null) => void;
  hkProjects?: SavedHKProject[];
  fmProjects?: SavedProject[];
  retrofitProjects?: SavedRetrofitProject[];
  onNavigate?: (tab: 'hk' | 'fm' | 'retrofit', projectId?: string) => void;
  onDeleteHK?: (projectId: string, projectName: string) => void;
  onDeleteFM?: (projectId: string, projectName: string) => void;
  onDeleteRetrofit?: (projectName: string) => void;
  onStatusChange?: (type: 'hk' | 'fm' | 'retrofit', project: any) => void;
  onHeightChange?: (height: number) => void;
}

export default function ProcessFlowVisualization({
  onStatusFilter,
  hkProjects = [],
  fmProjects = [],
  retrofitProjects = [],
  onNavigate,
  onDeleteHK,
  onDeleteFM,
  onDeleteRetrofit,
  onStatusChange,
  onHeightChange
}: ProcessFlowVisualizationProps) {
  const [projectCounts, setProjectCounts] = useState<Map<ProjectStatus, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<ProjectStatus | null>(null);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    hk: false,
    fm: false,
    retrofit: false,
  });

  const stages: ProcessStage[] = [
    { id: 'DRAFT', label: 'Draft', icon: Edit, color: 'text-gray-600', bgColor: 'bg-gray-100' },
    { id: 'SUBMITTED', label: 'Submitted', icon: Send, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { id: 'PENDING_CLIENT_DECISION', label: 'Pending Decision', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { id: 'AWARDED', label: 'Awarded', icon: Award, color: 'text-green-600', bgColor: 'bg-green-100' },
    { id: 'LOST', label: 'Lost', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
    { id: 'CANCELLED', label: 'Cancelled', icon: Ban, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  useEffect(() => {
    loadProjectCounts();
  }, []);

  const loadProjectCounts = async () => {
    try {
      setLoading(true);
      const counts = new Map<ProjectStatus, number>();

      const [hkData, fmData, retrofitData] = await Promise.all([
        supabase.from('hk_projects').select('status', { count: 'exact' }),
        supabase.from('fm_projects').select('status', { count: 'exact' }),
        supabase.from('retrofit_projects').select('status', { count: 'exact' }),
      ]);

      const allProjects = [
        ...(hkData.data || []),
        ...(fmData.data || []),
        ...(retrofitData.data || []),
      ];

      allProjects.forEach(project => {
        const status = project.status || 'DRAFT';
        counts.set(status as ProjectStatus, (counts.get(status as ProjectStatus) || 0) + 1);
      });

      setProjectCounts(counts);
    } catch (error) {
      console.error('Error loading project counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalProjects = () => {
    return Array.from(projectCounts.values()).reduce((sum, count) => sum + count, 0);
  };

  const getStagePercentage = (status: ProjectStatus) => {
    const total = getTotalProjects();
    if (total === 0) return 0;
    return ((projectCounts.get(status) || 0) / total) * 100;
  };

  const handleStageClick = (status: ProjectStatus) => {
    const newStatus = selectedStage === status ? null : status;
    setSelectedStage(newStatus);

    if (newStatus) {
      setShowAllProjects(true);
    }

    if (onStatusFilter) {
      onStatusFilter(newStatus);
    }
  };

  const filterProjects = <T extends { project_name: string; status?: string }>(projects: T[]) => {
    return projects.filter((p) => {
      const matchesSearch = !searchQuery || p.project_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !selectedStage || p.status === selectedStage;
      return matchesSearch && matchesStatus;
    });
  };

  const filteredHK = filterProjects(hkProjects);
  const filteredFM = filterProjects(fmProjects);
  const filteredRetrofit = filterProjects(retrofitProjects);
  const totalFilteredProjects = filteredHK.length + filteredFM.length + filteredRetrofit.length;

  useEffect(() => {
    if (onHeightChange) {
      const baseHeight = 4;
      let additionalHeight = 0;

      if (showAllProjects) {
        additionalHeight += 1;

        const projectsPerRow = 3;

        if (expandedSections.hk && filteredHK.length > 0) {
          const rows = Math.ceil(filteredHK.length / projectsPerRow);
          additionalHeight += Math.max(2, rows * 1.5);
        }

        if (expandedSections.fm && filteredFM.length > 0) {
          const rows = Math.ceil(filteredFM.length / projectsPerRow);
          additionalHeight += Math.max(2, rows * 1.5);
        }

        if (expandedSections.retrofit && filteredRetrofit.length > 0) {
          const rows = Math.ceil(filteredRetrofit.length / projectsPerRow);
          additionalHeight += Math.max(2, rows * 1.5);
        }
      }

      onHeightChange(baseHeight + additionalHeight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAllProjects, expandedSections, filteredHK.length, filteredFM.length, filteredRetrofit.length]);

  const ProjectCard = ({
    project,
    type,
    icon: Icon,
    color,
  }: {
    project: SavedHKProject | SavedProject | SavedRetrofitProject;
    type: 'hk' | 'fm' | 'retrofit';
    icon: React.ElementType;
    color: string;
  }) => {
    const getProjectInfo = () => {
      if ('project_data' in project) {
        if (type === 'hk') {
          const hkProject = project as SavedHKProject;
          return {
            location: hkProject.project_data?.projectInfo?.location || '',
            clientName: hkProject.project_data?.projectInfo?.clientName || '',
          };
        } else if (type === 'fm') {
          const fmProject = project as SavedProject;
          return {
            location: fmProject.project_data?.projectInfo?.projectLocation || '',
            clientName: '',
          };
        } else {
          const retrofitProject = project as SavedRetrofitProject;
          return {
            location: retrofitProject.project_data?.projectInfo?.projectLocation || '',
            clientName: retrofitProject.project_data?.projectInfo?.clientName || '',
          };
        }
      }
      return { location: '', clientName: '' };
    };

    const info = getProjectInfo();

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 ${color} rounded-lg flex-shrink-0`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 break-words flex-1 min-w-0">{project.project_name}</h3>
                <div className="flex-shrink-0">
                  <StatusBadge status={project.status} />
                </div>
              </div>
              {info.location && (
                <p className="text-sm text-gray-600 truncate">{info.location}</p>
              )}
              {info.clientName && (
                <p className="text-sm text-gray-500 truncate">{info.clientName}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Updated: {new Date(project.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onStatusChange && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                try {
                  onStatusChange(type, project);
                } catch (error) {
                  console.error('Error changing status:', error);
                }
              }}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded hover:bg-gray-50"
              title="Change Status"
            >
              <Tag className="w-4 h-4" />
            </button>
          )}
          {onNavigate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                try {
                  console.log('Navigating to:', type, project.id);
                  onNavigate(type, project.id);
                } catch (error) {
                  console.error('Error navigating:', error);
                }
              }}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Open
            </button>
          )}
          {type === 'hk' && onDeleteHK && (
            <button
              onClick={() => onDeleteHK(project.id, project.project_name)}
              className="p-2 text-gray-600 hover:text-red-600 transition-colors rounded hover:bg-gray-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {type === 'fm' && onDeleteFM && (
            <button
              onClick={() => onDeleteFM(project.id, project.project_name)}
              className="p-2 text-gray-600 hover:text-red-600 transition-colors rounded hover:bg-gray-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {type === 'retrofit' && onDeleteRetrofit && (
            <button
              onClick={() => onDeleteRetrofit(project.project_name)}
              className="p-2 text-gray-600 hover:text-red-600 transition-colors rounded hover:bg-gray-50"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading process flow...</span>
        </div>
      </div>
    );
  }

  const totalProjects = getTotalProjects();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Project Process Flow</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track projects through their lifecycle stages
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{totalProjects}</div>
          <div className="text-sm text-gray-600">Total Projects</div>
        </div>
      </div>

      {totalProjects === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No Projects Yet</h4>
          <p className="text-gray-600">
            Create your first project to see the process flow visualization
          </p>
        </div>
      ) : (
        <>
          <div className="relative mb-8">
            <div className="flex items-center justify-between">
              {stages.map((stage, index) => {
                const Icon = stage.icon;
                const count = projectCounts.get(stage.id) || 0;
                const percentage = getStagePercentage(stage.id);
                const isSelected = selectedStage === stage.id;

                return (
                  <div key={stage.id} className="flex items-center flex-1">
                    <button
                      onClick={() => handleStageClick(stage.id)}
                      className={`relative group transition-all ${
                        isSelected ? 'scale-110' : 'hover:scale-105'
                      }`}
                    >
                      <div
                        className={`w-16 h-16 rounded-full ${stage.bgColor} border-4 ${
                          isSelected ? 'border-blue-600 shadow-lg' : 'border-white shadow-md'
                        } flex items-center justify-center transition-all`}
                      >
                        <Icon className={`w-7 h-7 ${stage.color}`} />
                      </div>

                      {count > 0 && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                          {count}
                        </div>
                      )}

                      <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 text-center min-w-[100px]">
                        <div className={`text-sm font-semibold ${stage.color} whitespace-nowrap`}>
                          {stage.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {percentage.toFixed(0)}% of total
                        </div>
                      </div>
                    </button>

                    {index < stages.length - 1 && (
                      <div className="flex-1 mx-2 h-1 bg-gray-200 rounded relative overflow-hidden">
                        <div
                          className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded transition-all duration-500"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900 mb-1">Process Insights</h4>
                <p className="text-xs text-blue-700">
                  {projectCounts.get('AWARDED') || 0} projects have been awarded.
                  {(projectCounts.get('SUBMITTED') || 0) + (projectCounts.get('PENDING_CLIENT_DECISION') || 0) > 0 &&
                    ` ${(projectCounts.get('SUBMITTED') || 0) + (projectCounts.get('PENDING_CLIENT_DECISION') || 0)} projects awaiting client decision.`
                  }
                  {' '}Click on any stage to filter and view projects in that status.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {hkProjects.length > 0 || fmProjects.length > 0 || retrofitProjects.length > 0 ? (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <button
            onClick={() => setShowAllProjects(!showAllProjects)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900">
                All Projects ({totalProjects})
                {selectedStage && (
                  <span className="ml-2 text-sm font-normal text-blue-600">
                    (Filtered: {totalFilteredProjects})
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-600 mt-1">
                {selectedStage ? 'Showing filtered projects' : 'View all your projects organized by type'}
              </p>
            </div>
            {showAllProjects ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {showAllProjects && (
            <div className="mt-4 space-y-4">
              {selectedStage && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-900">
                      Filtering by: <span className="font-semibold">{selectedStage.replace(/_/g, ' ')}</span>
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedStage(null);
                      if (onStatusFilter) onStatusFilter(null);
                    }}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects by name..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                />
              </div>

              {filteredHK.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, hk: !prev.hk }))}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-600 rounded-lg">
                        <Layers className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-gray-900">Housekeeping Projects ({filteredHK.length})</span>
                    </div>
                    {expandedSections.hk ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {expandedSections.hk && (
                    <div className="p-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredHK.map((project) => (
                          <ProjectCard key={project.id} project={project} type="hk" icon={Layers} color="bg-green-600" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {filteredFM.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, fm: !prev.fm }))}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-600 rounded-lg">
                        <Wrench className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-gray-900">FM MEP Projects ({filteredFM.length})</span>
                    </div>
                    {expandedSections.fm ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {expandedSections.fm && (
                    <div className="p-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredFM.map((project) => (
                          <ProjectCard key={project.id} project={project} type="fm" icon={Wrench} color="bg-orange-600" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {filteredRetrofit.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedSections(prev => ({ ...prev, retrofit: !prev.retrofit }))}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-600 rounded-lg">
                        <HardHat className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-semibold text-gray-900">Retrofit Projects ({filteredRetrofit.length})</span>
                    </div>
                    {expandedSections.retrofit ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {expandedSections.retrofit && (
                    <div className="p-3 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredRetrofit.map((project) => (
                          <ProjectCard key={project.id} project={project} type="retrofit" icon={HardHat} color="bg-blue-600" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {totalFilteredProjects === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No projects match your search.' : 'No projects found with the selected filter.'}
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
