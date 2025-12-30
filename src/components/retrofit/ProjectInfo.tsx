import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RetrofitProjectInfo, EstimationMode } from '../../types/retrofit';

interface ProjectInfoProps {
  projectInfo: RetrofitProjectInfo;
  onChange: (projectInfo: RetrofitProjectInfo) => void;
  showModeSelector?: boolean;
  isModeLocked?: boolean;
}

export function ProjectInfo({ projectInfo, onChange, showModeSelector = false, isModeLocked = false }: ProjectInfoProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const currentMode = projectInfo.estimationMode || 'standard';

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <h2 className="text-xl font-semibold text-gray-800">Project Information</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6">

      {showModeSelector && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Estimation Method {isModeLocked && <span className="text-red-600">(Locked)</span>}
          </label>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="estimationMode"
                value="standard"
                checked={currentMode === 'standard'}
                onChange={(e) => !isModeLocked && onChange({ ...projectInfo, estimationMode: e.target.value as EstimationMode })}
                disabled={isModeLocked}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">Standard Mode</div>
                <div className="text-sm text-gray-600">
                  Traditional estimation with separate sections for Assets, Materials, Manpower, etc.
                </div>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="estimationMode"
                value="boq"
                checked={currentMode === 'boq'}
                onChange={(e) => !isModeLocked && onChange({ ...projectInfo, estimationMode: e.target.value as EstimationMode })}
                disabled={isModeLocked}
                className="mt-1"
              />
              <div>
                <div className="font-medium text-gray-900">BOQ Import Mode</div>
                <div className="text-sm text-gray-600">
                  Upload a Bill of Quantities Excel file with all project line items
                </div>
              </div>
            </label>
          </div>
          {isModeLocked && (
            <p className="mt-3 text-sm text-amber-700 bg-amber-50 p-2 rounded">
              The estimation method is locked and cannot be changed after the first save.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input
            type="text"
            value={projectInfo.projectName}
            onChange={(e) => onChange({ ...projectInfo, projectName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter project name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={projectInfo.projectLocation}
            onChange={(e) => onChange({ ...projectInfo, projectLocation: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Project location"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
          <input
            type="text"
            value={projectInfo.clientName}
            onChange={(e) => onChange({ ...projectInfo, clientName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Client name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={projectInfo.startDate}
            onChange={(e) => onChange({ ...projectInfo, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={projectInfo.endDate}
            onChange={(e) => onChange({ ...projectInfo, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
          <textarea
            value={projectInfo.projectDescription}
            onChange={(e) => onChange({ ...projectInfo, projectDescription: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Brief project description"
          />
        </div>
      </div>
        </div>
      )}
    </div>
  );
}
