import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { ProjectPhase } from '../../types/retrofit';

interface ProjectPhasesProps {
  phases: ProjectPhase[];
  onChange: (phases: ProjectPhase[]) => void;
}

export function ProjectPhases({ phases, onChange }: ProjectPhasesProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const addPhase = () => {
    const newPhase: ProjectPhase = {
      id: crypto.randomUUID(),
      name: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      durationDays: 30,
    };
    onChange([...phases, newPhase]);
  };

  const updatePhase = (id: string, updates: Partial<ProjectPhase>) => {
    onChange(
      phases.map((phase) => {
        if (phase.id !== id) return phase;
        const updated = { ...phase, ...updates };

        if (updates.startDate || updates.endDate) {
          const start = new Date(updated.startDate);
          const end = new Date(updated.endDate);
          updated.durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }

        return updated;
      })
    );
  };

  const removePhase = (id: string) => {
    onChange(phases.filter((p) => p.id !== id));
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors rounded-t-lg"
      >
        <h2 className="text-xl font-semibold text-gray-800">Project Phases</h2>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={addPhase}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={18} />
              Add Phase
            </button>
          </div>

      <div className="space-y-4">
        {phases.map((phase) => (
          <div key={phase.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase Name</label>
                <input
                  type="text"
                  value={phase.name}
                  onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Phase name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={phase.startDate}
                  onChange={(e) => updatePhase(phase.id, { startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={phase.endDate}
                  onChange={(e) => updatePhase(phase.id, { endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                  {phase.durationDays} days
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => removePhase(phase.id)}
                  className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

          {phases.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No phases added yet. Click "Add Phase" to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
