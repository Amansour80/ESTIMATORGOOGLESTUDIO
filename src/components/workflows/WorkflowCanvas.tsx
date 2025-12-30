import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Save, Play, AlertCircle } from 'lucide-react';
import { nodeTypes } from './nodes';
import { saveWorkflowCanvas, getWorkflowCanvas } from '../../utils/workflowDatabase';
import NodeConfigPanel from './NodeConfigPanel';

interface WorkflowCanvasProps {
  workflowId: string;
  readOnly?: boolean;
  onSave?: () => void;
}

export default function WorkflowCanvas({
  workflowId,
  readOnly = false,
  onSave,
}: WorkflowCanvasProps) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCanvas();
  }, [workflowId]);

  const handleConfigureNode = useCallback((nodeId: string) => {
    setNodes((currentNodes) => {
      const foundNode = currentNodes.find((n) => n.id === nodeId);
      if (foundNode) {
        setSelectedNode(foundNode);
        setShowConfigPanel(true);
      }
      return currentNodes;
    });
  }, []);

  const loadCanvas = async () => {
    try {
      const canvas = await getWorkflowCanvas(workflowId);
      if (canvas) {
        // Add onConfigure callback to all loaded nodes
        const nodesWithCallbacks = (canvas.nodes || []).map((node) => ({
          ...node,
          data: {
            ...node.data,
            onConfigure: handleConfigureNode,
          },
        }));
        setNodes(nodesWithCallbacks);
        setEdges(canvas.edges || []);
      } else {
        // Initialize with start node
        setNodes([
          {
            id: 'start-1',
            type: 'start',
            position: { x: 250, y: 50 },
            data: {},
          },
        ]);
        setEdges([]);
      }
    } catch (error) {
      console.error('Failed to load canvas:', error);
    }
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (!readOnly) {
        setNodes((nds) => applyNodeChanges(changes, nds));
      }
    },
    [readOnly]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (!readOnly) {
        setEdges((eds) => applyEdgeChanges(changes, eds));
      }
    },
    [readOnly]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      if (!readOnly) {
        setEdges((eds) =>
          addEdge(
            {
              ...params,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#94a3b8', strokeWidth: 2 },
            },
            eds
          )
        );
      }
    },
    [readOnly]
  );

  const addNode = (type: 'approval' | 'condition' | 'end') => {
    const id = `${type}-${Date.now()}`;
    const position = {
      x: Math.random() * 300 + 200,
      y: Math.random() * 300 + 200,
    };

    const newNode: Node = {
      id,
      type,
      position,
      data: {
        id,
        stepName: type === 'approval' ? 'New Approval Step' : undefined,
        condition: type === 'condition' ? 'Value > 0' : undefined,
        endType: type === 'end' ? 'approved' : undefined,
        roles: [],
        requireAll: false,
        onConfigure: handleConfigureNode,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const handleSave = async () => {
    const validationErrors = validateWorkflow();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const viewport = { x: 0, y: 0, zoom: 1 };
      await saveWorkflowCanvas(workflowId, nodes, edges, viewport);
      setErrors([]);
      if (onSave) onSave();
      alert('Workflow saved successfully!');
    } catch (error) {
      alert('Failed to save workflow: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const validateWorkflow = (): string[] => {
    const errors: string[] = [];

    // Check for start node
    const startNodes = nodes.filter((n) => n.type === 'start');
    if (startNodes.length === 0) {
      errors.push('Workflow must have a Start node');
    } else if (startNodes.length > 1) {
      errors.push('Workflow can only have one Start node');
    }

    // Check for end nodes
    const endNodes = nodes.filter((n) => n.type === 'end');
    if (endNodes.length === 0) {
      errors.push('Workflow must have at least one End node');
    }

    // Check approval nodes have roles assigned
    const approvalNodes = nodes.filter((n) => n.type === 'approval');
    approvalNodes.forEach((node) => {
      if (!node.data.roles || node.data.roles.length === 0) {
        errors.push(`Approval step "${node.data.stepName}" has no roles assigned`);
      }
    });

    // Check all nodes are connected
    const disconnectedNodes = nodes.filter((node) => {
      if (node.type === 'start') {
        return !edges.some((e) => e.source === node.id);
      }
      if (node.type === 'end') {
        return !edges.some((e) => e.target === node.id);
      }
      const hasInput = edges.some((e) => e.target === node.id);
      const hasOutput = edges.some((e) => e.source === node.id);
      return !hasInput || !hasOutput;
    });

    if (disconnectedNodes.length > 0) {
      errors.push(`${disconnectedNodes.length} node(s) are not connected`);
    }

    return errors;
  };

  const handleNodeConfigSave = (updatedNode: Node) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === updatedNode.id) {
          return {
            ...n,
            data: {
              ...updatedNode.data,
              onConfigure: n.data.onConfigure,
            },
          };
        }
        return n;
      })
    );
    setShowConfigPanel(false);
    setSelectedNode(null);
  };

  return (
    <div className="h-full flex flex-col">
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 mb-2">Workflow Validation Errors:</p>
            <ul className="text-sm text-red-600 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <button
                onClick={() => addNode('approval')}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Approval Step
              </button>
              <button
                onClick={() => addNode('condition')}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Condition
              </button>
              <button
                onClick={() => addNode('end')}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                End
              </button>
            </>
          )}
        </div>

        {!readOnly && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Workflow'}
          </button>
        )}
      </div>

      <div ref={reactFlowWrapper} className="flex-1 bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          }}
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="bg-white border border-gray-300 rounded-lg"
          />
        </ReactFlow>
      </div>

      {showConfigPanel && selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onSave={handleNodeConfigSave}
          onClose={() => {
            setShowConfigPanel(false);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
}
