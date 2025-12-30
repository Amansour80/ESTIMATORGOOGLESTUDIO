import type { ProjectInfo } from '../types';

interface Props {
  projectInfo: ProjectInfo;
  onChange: (projectInfo: ProjectInfo) => void;
}

export default function ProjectInfoComponent({ projectInfo, onChange }: Props) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-300">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Name
          </label>
          <input
            type="text"
            value={projectInfo.clientName || ''}
            onChange={(e) => onChange({ ...projectInfo, clientName: e.target.value })}
            placeholder="Enter client name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={projectInfo.projectName}
            onChange={(e) => onChange({ ...projectInfo, projectName: e.target.value })}
            placeholder="Enter project name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Location
          </label>
          <input
            type="text"
            value={projectInfo.projectLocation}
            onChange={(e) => onChange({ ...projectInfo, projectLocation: e.target.value })}
            placeholder="Enter location"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Type
          </label>
          <input
            type="text"
            value={projectInfo.projectType}
            onChange={(e) => onChange({ ...projectInfo, projectType: e.target.value })}
            placeholder="e.g., Office, Residential, Commercial"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
