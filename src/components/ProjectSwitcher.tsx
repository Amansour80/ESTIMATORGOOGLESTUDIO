import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Folder, Search, X } from 'lucide-react';

interface Project {
  id: string;
  project_name: string;
  client_name?: string;
  updated_at: string;
}

interface ProjectSwitcherProps {
  currentProjectId: string | null;
  currentProjectName: string;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  type: 'HK' | 'FM' | 'Retrofit';
}

export default function ProjectSwitcher({
  currentProjectId,
  currentProjectName,
  projects,
  onSelectProject,
  type
}: ProjectSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProjects = projects.filter(p =>
    p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentProjects = filteredProjects
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-colors min-w-[250px]"
      >
        <Folder className="w-4 h-4 text-gray-500" />
        <div className="flex-1 text-left">
          <div className="text-xs text-gray-500">{type} Project</div>
          <div className="font-medium text-sm text-gray-900 truncate">
            {currentProjectName || 'Select a project'}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-[400px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[500px] flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${type} projects...`}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {recentProjects.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Folder className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm">
                  {searchQuery ? 'No projects found' : 'No projects yet'}
                </p>
              </div>
            ) : (
              <div className="py-2">
                {!searchQuery && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Recent Projects
                  </div>
                )}
                {recentProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      onSelectProject(project.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                      currentProjectId === project.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <Folder className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      currentProjectId === project.id ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm truncate ${
                        currentProjectId === project.id ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {project.project_name}
                      </div>
                      {project.client_name && (
                        <div className="text-xs text-gray-500 truncate">
                          {project.client_name}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(project.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200 bg-gray-50">
            <div className="text-xs text-gray-500 px-2">
              Showing {recentProjects.length} of {projects.length} projects
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
