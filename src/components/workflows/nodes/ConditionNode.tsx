import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, Settings } from 'lucide-react';

export default function ConditionNode({ data, selected }: NodeProps) {
  const condition = data.condition || 'No conditions set';
  const hasRules = data.conditionRules && data.conditionRules.length > 0;

  return (
    <div
      className={`px-5 py-4 rounded-lg border-2 bg-white shadow-md transition-all min-w-[220px] max-w-[280px] ${
        selected ? 'border-purple-500 shadow-lg' : 'border-purple-300'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500 !border-2 !border-white"
      />

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
            <GitBranch className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm">Condition</div>
            <div className={`text-xs mt-0.5 ${hasRules ? 'text-gray-700' : 'text-orange-600'}`}>
              {condition}
            </div>
          </div>
          {data.onConfigure && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onConfigure(data.id);
              }}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
              title="Configure condition"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        className="w-3 h-3 !bg-green-500 !border-2 !border-white !left-[30%]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        className="w-3 h-3 !bg-red-500 !border-2 !border-white !left-[70%]"
      />
    </div>
  );
}
