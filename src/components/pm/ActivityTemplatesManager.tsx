import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Copy, FileText, List, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ActivityTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  is_system_template: boolean;
  created_at: string;
}

interface TemplateItem {
  id: string;
  template_id: string;
  sequence_order: number;
  name: string;
  description: string;
  duration_days: number;
  assignee_type: string;
  depends_on_sequence: number | null;
  dependency_type: string;
}

interface ActivityTemplatesManagerProps {
  organizationId: string;
  onApplyTemplate?: (templateId: string) => void;
}

const TEMPLATE_CATEGORIES = [
  'HVAC Installation',
  'Electrical Works',
  'Plumbing',
  'Civil Works',
  'Finishing',
  'General Construction'
];

export default function ActivityTemplatesManager({ organizationId, onApplyTemplate }: ActivityTemplatesManagerProps) {
  const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
  const [templateItems, setTemplateItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    description: '',
    category: TEMPLATE_CATEGORIES[0]
  });
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemFormData, setItemFormData] = useState({
    name: '',
    description: '',
    duration_days: 1,
    assignee_type: '',
    depends_on_sequence: null as number | null,
    dependency_type: 'FS'
  });

  useEffect(() => {
    loadTemplates();
  }, [organizationId]);

  useEffect(() => {
    if (selectedTemplate) {
      loadTemplateItems(selectedTemplate.id);
    }
  }, [selectedTemplate]);

  async function loadTemplates() {
    try {
      const { data, error } = await supabase
        .from('activity_templates')
        .select('*')
        .or(`organization_id.eq.${organizationId},is_system_template.eq.true`)
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplateItems(templateId: string) {
    try {
      const { data, error } = await supabase
        .from('activity_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('sequence_order', { ascending: true });

      if (error) throw error;
      setTemplateItems(data || []);
    } catch (error) {
      console.error('Error loading template items:', error);
      setTemplateItems([]);
    }
  }

  function openAddTemplateForm() {
    setEditingTemplateId(null);
    setTemplateFormData({
      name: '',
      description: '',
      category: TEMPLATE_CATEGORIES[0]
    });
    setShowTemplateForm(true);
  }

  function openEditTemplateForm(template: ActivityTemplate) {
    setEditingTemplateId(template.id);
    setTemplateFormData({
      name: template.name,
      description: template.description || '',
      category: template.category
    });
    setShowTemplateForm(true);
  }

  async function handleSaveTemplate(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingTemplateId) {
        const { error } = await supabase
          .from('activity_templates')
          .update({
            name: templateFormData.name,
            description: templateFormData.description,
            category: templateFormData.category,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTemplateId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('activity_templates')
          .insert([{
            name: templateFormData.name,
            description: templateFormData.description,
            category: templateFormData.category,
            organization_id: organizationId,
            created_by: user.id
          }]);

        if (error) throw error;
      }

      setShowTemplateForm(false);
      loadTemplates();
    } catch (error: any) {
      console.error('Error saving template:', error);
      alert(`Failed to save template: ${error.message || 'Please try again.'}`);
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this template and all its items?')) return;

    try {
      const { error } = await supabase
        .from('activity_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
        setTemplateItems([]);
      }

      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template. Please try again.');
    }
  }

  function openAddItemForm() {
    if (!selectedTemplate) return;
    setEditingItemId(null);
    setItemFormData({
      name: '',
      description: '',
      duration_days: 1,
      assignee_type: '',
      depends_on_sequence: null,
      dependency_type: 'FS'
    });
    setShowItemForm(true);
  }

  function openEditItemForm(item: TemplateItem) {
    setEditingItemId(item.id);
    setItemFormData({
      name: item.name,
      description: item.description || '',
      duration_days: item.duration_days,
      assignee_type: item.assignee_type || '',
      depends_on_sequence: item.depends_on_sequence,
      dependency_type: item.dependency_type || 'FS'
    });
    setShowItemForm(true);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      if (editingItemId) {
        const { error } = await supabase
          .from('activity_template_items')
          .update({
            name: itemFormData.name,
            description: itemFormData.description,
            duration_days: itemFormData.duration_days,
            assignee_type: itemFormData.assignee_type || null,
            depends_on_sequence: itemFormData.depends_on_sequence,
            dependency_type: itemFormData.dependency_type
          })
          .eq('id', editingItemId);

        if (error) throw error;
      } else {
        const nextSequence = Math.max(0, ...templateItems.map(i => i.sequence_order)) + 1;
        const { error } = await supabase
          .from('activity_template_items')
          .insert([{
            template_id: selectedTemplate.id,
            sequence_order: nextSequence,
            name: itemFormData.name,
            description: itemFormData.description,
            duration_days: itemFormData.duration_days,
            assignee_type: itemFormData.assignee_type || null,
            depends_on_sequence: itemFormData.depends_on_sequence,
            dependency_type: itemFormData.dependency_type
          }]);

        if (error) throw error;
      }

      setShowItemForm(false);
      loadTemplateItems(selectedTemplate.id);
    } catch (error: any) {
      console.error('Error saving item:', error);
      alert(`Failed to save activity: ${error.message || 'Please try again.'}`);
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      const { error } = await supabase
        .from('activity_template_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      if (selectedTemplate) {
        loadTemplateItems(selectedTemplate.id);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete activity. Please try again.');
    }
  }

  async function moveItem(item: TemplateItem, direction: 'up' | 'down') {
    if (!selectedTemplate) return;

    const currentIndex = templateItems.findIndex(i => i.id === item.id);
    if (currentIndex === -1) return;
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === templateItems.length - 1) return;

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const swapItem = templateItems[swapIndex];

    try {
      await supabase
        .from('activity_template_items')
        .update({ sequence_order: swapItem.sequence_order })
        .eq('id', item.id);

      await supabase
        .from('activity_template_items')
        .update({ sequence_order: item.sequence_order })
        .eq('id', swapItem.id);

      loadTemplateItems(selectedTemplate.id);
    } catch (error) {
      console.error('Error reordering items:', error);
      alert('Failed to reorder activities. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Activity Templates</h2>
          <p className="text-sm text-gray-600 mt-1">
            Create reusable activity sequences for common construction workflows
          </p>
        </div>
        <button
          onClick={openAddTemplateForm}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 text-sm">Available Templates</h3>
          {templates.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">No templates yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900 truncate">
                        {template.name}
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">{template.category}</p>
                      {template.is_system_template && (
                        <span className="inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded mt-1">
                          System
                        </span>
                      )}
                    </div>
                    {!template.is_system_template && (
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditTemplateForm(template);
                          }}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                </div>
                {onApplyTemplate && (
                  <button
                    onClick={() => onApplyTemplate(selectedTemplate.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Copy className="w-4 h-4" />
                    Apply to Project
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 text-sm">Activities ({templateItems.length})</h4>
                  {!selectedTemplate.is_system_template && (
                    <button
                      onClick={openAddItemForm}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      Add Activity
                    </button>
                  )}
                </div>
                {templateItems.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                    <List className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-3">No activities in this template</p>
                    {!selectedTemplate.is_system_template && (
                      <button
                        onClick={openAddItemForm}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        Add First Activity
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templateItems.map((item, index) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-500">#{item.sequence_order}</span>
                              <span className="font-medium text-sm text-gray-900">{item.name}</span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-600 mt-1">{item.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Duration: {item.duration_days} days</span>
                              {item.assignee_type && (
                                <span>Assignee: {item.assignee_type}</span>
                              )}
                              {item.depends_on_sequence && (
                                <span>Depends on: #{item.depends_on_sequence} ({item.dependency_type})</span>
                              )}
                            </div>
                          </div>
                          {!selectedTemplate.is_system_template && (
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => moveItem(item, 'up')}
                                disabled={index === 0}
                                className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveItem(item, 'down')}
                                disabled={index === templateItems.length - 1}
                                className="text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ArrowDown className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditItemForm(item)}
                                className="text-gray-400 hover:text-blue-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Select a template to view details</p>
            </div>
          )}
        </div>
      </div>

      {showTemplateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTemplateId ? 'Edit Template' : 'Create Template'}
              </h3>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateFormData.name}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Standard HVAC Installation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={templateFormData.category}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TEMPLATE_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={templateFormData.description}
                  onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe this template..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  {editingTemplateId ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowTemplateForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemForm && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingItemId ? 'Edit Activity' : 'Add Activity'}
              </h3>
            </div>

            <form onSubmit={handleSaveItem} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Name *
                </label>
                <input
                  type="text"
                  value={itemFormData.name}
                  onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Site Survey"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={itemFormData.description}
                  onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe this activity..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={itemFormData.duration_days}
                    onChange={(e) => setItemFormData({ ...itemFormData, duration_days: parseInt(e.target.value) || 1 })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee Type
                  </label>
                  <select
                    value={itemFormData.assignee_type}
                    onChange={(e) => setItemFormData({ ...itemFormData, assignee_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    <option value="employee">Employee</option>
                    <option value="client_rep">Client Representative</option>
                    <option value="consultant">Consultant</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Dependency (Optional)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Depends on Activity #
                    </label>
                    <select
                      value={itemFormData.depends_on_sequence || ''}
                      onChange={(e) => setItemFormData({
                        ...itemFormData,
                        depends_on_sequence: e.target.value ? parseInt(e.target.value) : null
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">None</option>
                      {templateItems
                        .filter(item => item.id !== editingItemId)
                        .map(item => (
                          <option key={item.id} value={item.sequence_order}>
                            #{item.sequence_order} - {item.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dependency Type
                    </label>
                    <select
                      value={itemFormData.dependency_type}
                      onChange={(e) => setItemFormData({ ...itemFormData, dependency_type: e.target.value })}
                      disabled={!itemFormData.depends_on_sequence}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    >
                      <option value="FS">Finish-to-Start</option>
                      <option value="SS">Start-to-Start</option>
                      <option value="FF">Finish-to-Finish</option>
                      <option value="SF">Start-to-Finish</option>
                    </select>
                  </div>
                </div>
                {itemFormData.depends_on_sequence && (
                  <p className="text-xs text-gray-500 mt-2">
                    {itemFormData.dependency_type === 'FS' && `Activity #${itemFormData.depends_on_sequence} must finish before this activity starts`}
                    {itemFormData.dependency_type === 'SS' && `Activity #${itemFormData.depends_on_sequence} must start before this activity starts`}
                    {itemFormData.dependency_type === 'FF' && `Activity #${itemFormData.depends_on_sequence} must finish before this activity finishes`}
                    {itemFormData.dependency_type === 'SF' && `Activity #${itemFormData.depends_on_sequence} must start before this activity finishes`}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  {editingItemId ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowItemForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
