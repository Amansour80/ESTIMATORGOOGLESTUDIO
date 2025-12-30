import React, { useState, useEffect } from 'react';
import { X, Users } from 'lucide-react';
import type { Node } from 'reactflow';
import { useOrganization } from '../../contexts/OrganizationContext';
import { getOrganizationRoles, OrganizationRole } from '../../utils/rolesDatabase';
import ConditionBuilder from './ConditionBuilder';

interface NodeConfigPanelProps {
  node: Node;
  onSave: (node: Node) => void;
  onClose: () => void;
}

export default function NodeConfigPanel({ node, onSave, onClose }: NodeConfigPanelProps) {
  const { currentOrganization } = useOrganization();
  const [stepName, setStepName] = useState(node.data.stepName || '');
  const [selectedRoles, setSelectedRoles] = useState<OrganizationRole[]>(node.data.roles || []);
  const [requireAll, setRequireAll] = useState(node.data.requireAll || false);
  const [conditionRules, setConditionRules] = useState(node.data.conditionRules || []);
  const [endType, setEndType] = useState(node.data.endType || 'approved');
  const [availableRoles, setAvailableRoles] = useState<OrganizationRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadRoles();
    }
  }, [currentOrganization?.id]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const roles = await getOrganizationRoles(currentOrganization!.id);
      // Filter for roles that can approve
      const approverRoles = roles.filter((r) => r.permissions.can_approve);
      setAvailableRoles(approverRoles);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = (role: OrganizationRole) => {
    setSelectedRoles((prev) => {
      const exists = prev.find((r) => r.id === role.id);
      if (exists) {
        return prev.filter((r) => r.id !== role.id);
      } else {
        return [...prev, role];
      }
    });
  };

  const getConditionSummary = () => {
    if (!conditionRules || conditionRules.length === 0) {
      return 'No conditions';
    }
    return conditionRules
      .filter((r: any) => r.value)
      .map((r: any, i: number) => {
        const prefix = i > 0 ? ` ${r.logicalOperator} ` : '';
        return `${prefix}${r.field} ${r.operator} ${r.value}`;
      })
      .join('') || 'No conditions';
  };

  const handleSave = () => {
    const updatedNode: Node = {
      ...node,
      data: {
        ...node.data,
        stepName: node.type === 'approval' ? stepName : node.data.stepName,
        roles: node.type === 'approval' ? selectedRoles : node.data.roles,
        requireAll: node.type === 'approval' ? requireAll : node.data.requireAll,
        conditionRules: node.type === 'condition' ? conditionRules : node.data.conditionRules,
        condition: node.type === 'condition' ? getConditionSummary() : node.data.condition,
        endType: node.type === 'end' ? endType : node.data.endType,
      },
    };
    onSave(updatedNode);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            Configure {node.type === 'approval' ? 'Approval Step' : node.type === 'condition' ? 'Condition' : 'End Node'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {node.type === 'approval' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step Name
                </label>
                <input
                  type="text"
                  value={stepName}
                  onChange={(e) => setStepName(e.target.value)}
                  placeholder="e.g., Manager Approval, CFO Review"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Users className="w-4 h-4 inline mr-2" />
                  Approval Roles
                </label>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading roles...</div>
                ) : availableRoles.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      No roles with approval permissions found. Create roles with approval permissions first.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {availableRoles.map((role) => (
                      <label
                        key={role.id}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedRoles.find((r) => r.id === role.id)
                            ? 'border-blue-300 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedRoles.find((r) => r.id === role.id)}
                          onChange={() => handleRoleToggle(role)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: role.color }}
                          />
                          <span className="font-medium text-gray-900">{role.role_name}</span>
                          <span className="text-xs text-gray-500">({role.role_type})</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireAll}
                    onChange={(e) => setRequireAll(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Require approval from all selected roles
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-2 ml-6">
                  {requireAll
                    ? 'All roles must approve before proceeding'
                    : 'Any one role can approve to proceed'}
                </p>
              </div>
            </>
          )}

          {node.type === 'condition' && (
            <ConditionBuilder
              initialRules={conditionRules}
              onRulesChange={setConditionRules}
            />
          )}

          {node.type === 'end' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                End Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="approved"
                    checked={endType === 'approved'}
                    onChange={(e) => setEndType(e.target.value)}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Approved</div>
                      <div className="text-xs text-gray-500">Project is fully approved and finalized</div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="rejected"
                    checked={endType === 'rejected'}
                    onChange={(e) => setEndType(e.target.value)}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Rejected</div>
                      <div className="text-xs text-gray-500">Project is permanently rejected</div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    value="revision"
                    checked={endType === 'revision'}
                    onChange={(e) => setEndType(e.target.value)}
                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Return for Revision</div>
                      <div className="text-xs text-gray-500">Send back to estimator for changes</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={
              (node.type === 'approval' && (!stepName.trim() || selectedRoles.length === 0)) ||
              (node.type === 'condition' && conditionRules.length === 0)
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
