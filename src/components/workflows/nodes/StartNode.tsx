import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PlayCircle } from 'lucide-react';

export default function StartNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`px-6 py-4 rounded-lg border-2 bg-white shadow-md transition-all ${
        selected ? 'border-green-500 shadow-lg' : 'border-green-300'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <PlayCircle className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">Start</div>
          <div className="text-xs text-gray-500">Workflow begins here</div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-green-500 !border-2 !border-white"
      />
    </div>
  );
}
