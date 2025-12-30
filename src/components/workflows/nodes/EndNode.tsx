import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { CheckCircle2, XCircle, RotateCcw, Settings } from 'lucide-react';

export default function EndNode({ data, selected }: NodeProps) {
  const endType = data.endType || 'approved';

  const getConfig = () => {
    switch (endType) {
      case 'approved':
        return {
          color: 'green',
          icon: CheckCircle2,
          title: 'Approved',
          description: 'Project approved',
          borderClass: selected ? 'border-green-500' : 'border-green-300',
        };
      case 'rejected':
        return {
          color: 'red',
          icon: XCircle,
          title: 'Rejected',
          description: 'Project rejected',
          borderClass: selected ? 'border-red-500' : 'border-red-300',
        };
      case 'revision':
        return {
          color: 'orange',
          icon: RotateCcw,
          title: 'Return for Revision',
          description: 'Sent back to estimator',
          borderClass: selected ? 'border-orange-500' : 'border-orange-300',
        };
      default:
        return {
          color: 'gray',
          icon: XCircle,
          title: 'End',
          description: 'Workflow end',
          borderClass: selected ? 'border-gray-500' : 'border-gray-300',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div
      className={`px-6 py-4 rounded-lg border-2 bg-white shadow-md transition-all ${config.borderClass}`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 !border-2 !border-white`}
        style={{ backgroundColor: config.color === 'green' ? '#22c55e' : config.color === 'red' ? '#ef4444' : '#f97316' }}
      />

      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
          style={{
            backgroundColor: config.color === 'green' ? '#dcfce7' : config.color === 'red' ? '#fee2e2' : '#ffedd5'
          }}
        >
          <Icon
            className="w-6 h-6"
            style={{
              color: config.color === 'green' ? '#16a34a' : config.color === 'red' ? '#dc2626' : '#ea580c'
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900">{config.title}</div>
          <div className="text-xs text-gray-500">{config.description}</div>
        </div>
        {data.onConfigure && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onConfigure(data.id);
            }}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
            title="Configure end type"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
