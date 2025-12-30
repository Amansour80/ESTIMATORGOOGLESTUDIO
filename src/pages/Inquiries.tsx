import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Calendar, AlertCircle, TrendingUp, Clock, ArrowRight, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useOrganization } from '../contexts/OrganizationContext';
import { usePermissions } from '../hooks/usePermissions';
import { Inquiry, InquiryStatus, InquiryPriority, InquiryProjectType } from '../types/inquiry';
import { getOrganizationInquiries, createInquiry, updateInquiry, deleteInquiry } from '../utils/inquiryDatabase';
import { supabase } from '../lib/supabase';
import { useUsageLimits } from '../hooks/useUsageLimits';
import { LimitReachedModal } from '../components/LimitReachedModal';

interface InquiriesProps {
  onConvertToEstimation?: (inquiry: Inquiry) => void;
  onNavigateToProject?: (projectType: 'hk' | 'fm' | 'retrofit', projectId: string) => void;
}

export function Inquiries({ onConvertToEstimation, onNavigateToProject }: InquiriesProps) {
  const { currentOrganization } = useOrganization();
  const { canCreateProject, canEditProject } = usePermissions();
  const { canCreateInquiry, usage, refreshUsage } = useUsageLimits();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInquiry, setEditingInquiry] = useState<Inquiry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [inquiryToConvert, setInquiryToConvert] = useState<Inquiry | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    client_inquiry_reference: '',
    client_name: '',
    client_email: '',
    client_phone: '',
    project_name: '',
    project_location: '',
    project_type: 'retrofit' as InquiryProjectType,
    description: '',
    deadline: '',
    estimated_value: '',
    priority: 'medium' as InquiryPriority,
    source: '',
    notes: ''
  });

  const loadInquiries = useCallback(async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const data = await getOrganizationInquiries(currentOrganization.id);
      setInquiries(data);
    } catch (error) {
      console.error('Error loading inquiries:', error);
      alert('Failed to load inquiries');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  const filterInquiries = useCallback(() => {
    let filtered = [...inquiries];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        inq =>
          inq.inquiry_number.toLowerCase().includes(term) ||
          (inq.client_inquiry_reference && inq.client_inquiry_reference.toLowerCase().includes(term)) ||
          inq.client_name.toLowerCase().includes(term) ||
          inq.project_name.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inq => inq.status === statusFilter);
    }

    setFilteredInquiries(filtered);
    setCurrentPage(1);
  }, [inquiries, searchTerm, statusFilter]);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadInquiries();
    }
  }, [currentOrganization?.id, loadInquiries]);

  useEffect(() => {
    filterInquiries();
  }, [filterInquiries]);

  const resetForm = () => {
    setFormData({
      client_inquiry_reference: '',
      client_name: '',
      client_email: '',
      client_phone: '',
      project_name: '',
      project_location: '',
      project_type: 'retrofit',
      description: '',
      deadline: '',
      estimated_value: '',
      priority: 'medium',
      source: '',
      notes: ''
    });
    setEditingInquiry(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOrganization) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!editingInquiry) {
      const canCreate = await canCreateInquiry();
      if (!canCreate) {
        setShowLimitModal(true);
        return;
      }
    }

    try {
      const inputData = {
        client_inquiry_reference: formData.client_inquiry_reference || undefined,
        client_name: formData.client_name,
        client_email: formData.client_email || undefined,
        client_phone: formData.client_phone || undefined,
        project_name: formData.project_name,
        project_location: formData.project_location || undefined,
        project_type: formData.project_type,
        description: formData.description || undefined,
        deadline: formData.deadline,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : undefined,
        priority: formData.priority,
        source: formData.source || undefined,
        notes: formData.notes || undefined
      };

      if (editingInquiry) {
        await updateInquiry(editingInquiry.id, inputData);
      } else {
        await createInquiry(currentOrganization.id, user.id, inputData);
      }

      refreshUsage();

      await loadInquiries();
      resetForm();
    } catch (error) {
      console.error('Error saving inquiry:', error);
      alert('Failed to save inquiry');
    }
  };

  const handleEdit = (inquiry: Inquiry) => {
    setFormData({
      client_inquiry_reference: inquiry.client_inquiry_reference || '',
      client_name: inquiry.client_name,
      client_email: inquiry.client_email || '',
      client_phone: inquiry.client_phone || '',
      project_name: inquiry.project_name,
      project_location: inquiry.project_location || '',
      project_type: inquiry.project_type,
      description: inquiry.description || '',
      deadline: inquiry.deadline,
      estimated_value: inquiry.estimated_value?.toString() || '',
      priority: inquiry.priority,
      source: inquiry.source || '',
      notes: inquiry.notes || ''
    });
    setEditingInquiry(inquiry);
    setShowForm(true);
  };

  const handleStatusChange = async (inquiry: Inquiry, newStatus: InquiryStatus) => {
    try {
      await updateInquiry(inquiry.id, { status: newStatus });
      await loadInquiries();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleConvert = (inquiry: Inquiry) => {
    setInquiryToConvert(inquiry);
    setShowConvertModal(true);
  };

  const confirmConversion = () => {
    if (inquiryToConvert && onConvertToEstimation) {
      onConvertToEstimation(inquiryToConvert);
      setShowConvertModal(false);
      setInquiryToConvert(null);
    }
  };

  const handleDelete = async (inquiry: Inquiry) => {
    if (inquiry.status === 'converted') {
      alert('Cannot delete a converted inquiry. Delete the project estimation first.');
      return;
    }

    if (!confirm(`Delete inquiry "${inquiry.inquiry_number}" for ${inquiry.client_name}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteInquiry(inquiry.id);
      alert('Inquiry deleted successfully!');
      loadInquiries();
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      alert('Failed to delete inquiry. Please try again.');
    }
  };

  const getStatusColor = (status: InquiryStatus) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: InquiryPriority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getDeadlineStatus = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600' };
    if (diffDays === 0) return { text: 'Today', color: 'text-orange-600' };
    if (diffDays === 1) return { text: 'Tomorrow', color: 'text-yellow-600' };
    if (diffDays <= 7) return { text: `${diffDays} days`, color: 'text-yellow-600' };
    return { text: `${diffDays} days`, color: 'text-gray-600' };
  };

  const stats = {
    total: inquiries.length,
    new: inquiries.filter(i => i.status === 'new').length,
    in_review: inquiries.filter(i => i.status === 'in_review').length,
    overdue: inquiries.filter(i => {
      const deadline = new Date(i.deadline);
      deadline.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return deadline < today && i.status !== 'converted' && i.status !== 'lost' && i.status !== 'expired';
    }).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading inquiries...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inquiries</h1>
          <p className="text-gray-600 mt-1">Manage project inquiries and convert them to estimations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={20} />
          New Inquiry
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Inquiries</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <TrendingUp className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">New</p>
              <p className="text-3xl font-bold text-blue-600">{stats.new}</p>
            </div>
            <AlertCircle className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Review</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.in_review}</p>
            </div>
            <Clock className="text-yellow-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <AlertCircle className="text-red-600" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search inquiries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InquiryStatus | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="in_review">In Review</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inquiry #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client Ref</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInquiries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((inquiry) => {
                const deadlineStatus = getDeadlineStatus(inquiry.deadline);
                return (
                  <tr key={inquiry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{inquiry.inquiry_number}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {inquiry.client_inquiry_reference || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{inquiry.client_name}</div>
                      {inquiry.client_email && (
                        <div className="text-xs text-gray-500">{inquiry.client_email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{inquiry.project_name}</div>
                      {inquiry.project_location && (
                        <div className="text-xs text-gray-500">{inquiry.project_location}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 uppercase">{inquiry.project_type}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className={deadlineStatus.color} />
                        <div>
                          <div className="text-sm text-gray-900">{new Date(inquiry.deadline).toLocaleDateString()}</div>
                          <div className={`text-xs ${deadlineStatus.color}`}>{deadlineStatus.text}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium uppercase ${getPriorityColor(inquiry.priority)}`}>
                        {inquiry.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusChange(inquiry, e.target.value as InquiryStatus)}
                        className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(inquiry.status)} border-0 cursor-pointer`}
                      >
                        <option value="new">New</option>
                        <option value="in_review">In Review</option>
                        <option value="converted">Converted</option>
                        <option value="lost">Lost</option>
                        <option value="expired">Expired</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {inquiry.status !== 'converted' ? (
                          <button
                            onClick={() => handleEdit(inquiry)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            Edit
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm font-medium cursor-not-allowed" title="Cannot edit converted inquiry">
                            Edit
                          </span>
                        )}
                        {inquiry.status === 'converted' && inquiry.converted_to_project_id && inquiry.converted_to_project_type ? (
                          <button
                            onClick={() => onNavigateToProject?.(inquiry.converted_to_project_type as 'hk' | 'fm' | 'retrofit', inquiry.converted_to_project_id!)}
                            className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1"
                          >
                            View Project <ArrowRight size={14} />
                          </button>
                        ) : inquiry.status !== 'converted' && (
                          <>
                            <button
                              onClick={() => handleConvert(inquiry)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1"
                            >
                              Convert <ArrowRight size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(inquiry)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1"
                              title="Delete inquiry"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredInquiries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No inquiries found</p>
            </div>
          )}
        </div>

        {filteredInquiries.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredInquiries.length)} of {filteredInquiries.length} inquiries
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(filteredInquiries.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 border rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredInquiries.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(filteredInquiries.length / itemsPerPage)}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingInquiry ? 'Edit Inquiry' : 'New Inquiry'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Inquiry Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., RFQ-2024-001"
                    value={formData.client_inquiry_reference}
                    onChange={(e) => setFormData({ ...formData, client_inquiry_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Type *
                  </label>
                  <select
                    required
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value as InquiryProjectType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="hk">Housekeeping</option>
                    <option value="fm">Facilities Management</option>
                    <option value="retrofit">Retrofit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority *
                  </label>
                  <select
                    required
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as InquiryPriority })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingInquiry ? 'Update Inquiry' : 'Create Inquiry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showConvertModal && inquiryToConvert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Convert to Estimation</h3>
            <p className="text-gray-600 mb-6">
              Convert inquiry <span className="font-semibold">{inquiryToConvert.inquiry_number}</span> to a{' '}
              <span className="font-semibold uppercase">{inquiryToConvert.project_type}</span> estimation?
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Project:</strong> {inquiryToConvert.project_name}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Client:</strong> {inquiryToConvert.client_name}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowConvertModal(false);
                  setInquiryToConvert(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmConversion}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
              >
                Convert to Estimation <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="inquiries"
        currentCount={usage?.inquiries_count || 0}
        maxCount={usage?.limits?.max_inquiries_per_month || 0}
      />
    </div>
  );
}
