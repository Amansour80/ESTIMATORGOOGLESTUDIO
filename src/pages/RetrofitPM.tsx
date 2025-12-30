import { useState, useEffect } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { getRetrofitPMProjects } from '../utils/pmDatabase';
import type { RetrofitProjectPM } from '../types/pm';
import { Building2, Calendar, TrendingUp, Search, Filter } from 'lucide-react';

export default function RetrofitPM() {
  const { currentOrganization } = useOrganization();
  const [projects, setProjects] = useState<RetrofitProjectPM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (currentOrganization?.id) {
      loadProjects();
    }
  }, [currentOrganization?.id]);

  async function loadProjects() {
    if (!currentOrganization?.id) return;

    try {
      setLoading(true);
      const data = await getRetrofitPMProjects(currentOrganization.id);
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.client_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.pm_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Retrofit Project Management</h1>
        <p className="text-gray-600">Manage and track your retrofit projects</p>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading projects...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map(project => (
            <a
              key={project.id}
              href={`#/retrofit-pm/${project.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {project.project_name}
                  </h3>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${
                      project.pm_status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : project.pm_status === 'Draft'
                        ? 'bg-gray-100 text-gray-800'
                        : project.pm_status === 'On Hold'
                        ? 'bg-yellow-100 text-yellow-800'
                        : project.pm_status === 'Completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {project.pm_status || 'Draft'}
                  </span>
                </div>

                {project.client_name && (
                  <p className="text-sm text-gray-600 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {project.client_name}
                  </p>
                )}

                <div className="space-y-3">
                  {project.forecast_end_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Target: {new Date(project.forecast_end_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-600" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{project.overall_progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${project.overall_progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {project.calculated_value && (
                    <div className="pt-3 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        Est. Value: <span className="font-semibold text-gray-900">
                          {new Intl.NumberFormat('en-AE', {
                            style: 'currency',
                            currency: 'AED',
                            minimumFractionDigits: 0,
                          }).format(project.calculated_value)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Updated: {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
