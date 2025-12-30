import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { UserCheck, Settings } from 'lucide-react';

export default function ApprovalNode({ data, selected }: NodeProps) {
  const stepName = data.stepName || 'Approval Step';
  const roles = data.roles || [];
  const requireAll = data.requireAll || false;

  return (
    <div
      className={`px-5 py-4 rounded-lg border-2 bg-white shadow-md transition-all min-w-[220px] ${
        selected ? 'border-blue-500 shadow-lg' : 'border-blue-300'
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 !border-2 !border-white"
      />

      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">{stepName}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {requireAll ? 'All approvers required' : 'Any approver can approve'}
            </div>
          </div>
          {data.onConfigure && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onConfigure(data.id);
              }}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Configure step"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {roles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {roles.slice(0, 3).map((role: any, index: number) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded"
                style={{ backgroundColor: role.color + '20', color: role.color }}
              >
                {role.name}
              </span>
            ))}
            {roles.length > 3 && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                +{roles.length - 3} more
              </span>
            )}
          </div>
        )}

        {roles.length === 0 && (
          <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            No roles assigned
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="approved"
        className="w-3 h-3 !bg-green-500 !border-2 !border-white !left-[30%]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="rejected"
        className="w-3 h-3 !bg-red-500 !border-2 !border-white !left-[70%]"
      />
    </div>
  );
}
