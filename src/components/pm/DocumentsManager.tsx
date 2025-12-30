import { useState, useEffect } from 'react';
import { Plus, FileText, Download, Upload, Edit2, Trash2, Clock, CheckCircle2, XCircle, MessageSquare, X, History } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import CommentsSection from './CommentsSection';
import { getDocumentStatusColor } from '../../utils/statusColors';

interface Document {
  id: string;
  title: string;
  category: string;
  workflow_status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DocumentVersion {
  id: string;
  version_number: number;
  title: string;
  category: string;
  workflow_status: string;
  created_by: string;
  created_at: string;
  notes: string;
  email?: string;
}

interface DocumentFormData {
  title: string;
  category: string;
}

interface DocumentsManagerProps {
  projectId: string;
  organizationId: string;
  isReadOnly?: boolean;
}

const DOCUMENT_CATEGORIES = [
  'Drawings',
  'Material Submittal',
  'Method Statement',
  'Inspection',
  'Handover',
  'Other'
];

const DOCUMENT_STATUSES = [
  'Draft',
  'Submitted',
  'Under Review',
  'Approved',
  'Rejected',
  'Resubmitted'
];

export default function DocumentsManager({ projectId, organizationId }: DocumentsManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [formData, setFormData] = useState<DocumentFormData>({
    title: '',
    category: 'Drawings'
  });

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  useEffect(() => {
    if (viewingDocument) {
      loadDocumentVersions(viewingDocument.id);
    }
  }, [viewingDocument]);

  async function loadDocuments() {
    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('retrofit_project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDocumentVersions(documentId: string) {
    try {
      setLoadingVersions(true);
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const { data: emails, error: emailsError } = await supabase.rpc('get_organization_members_with_emails', {
          org_id: organizationId
        });

        if (!emailsError && emails) {
          const versionsWithEmails = data.map(version => ({
            ...version,
            email: emails.find((e: any) => e.user_id === version.created_by)?.email || 'Unknown'
          }));
          setDocumentVersions(versionsWithEmails);
        } else {
          setDocumentVersions(data);
        }
      } else {
        setDocumentVersions([]);
      }
    } catch (error) {
      console.error('Error loading document versions:', error);
      setDocumentVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  }

  function openAddForm() {
    setEditingId(null);
    setFormData({
      title: '',
      category: 'Drawings'
    });
    setShowForm(true);
  }

  function openEditForm(doc: Document) {
    setEditingId(doc.id);
    setFormData({
      title: doc.title,
      category: doc.category
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingId) {
        const updateData = {
          title: formData.title,
          category: formData.category,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('project_documents')
          .update(updateData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const insertData = {
          title: formData.title,
          category: formData.category,
          retrofit_project_id: projectId,
          organization_id: organizationId,
          created_by: user.id,
          workflow_status: 'Draft'
        };

        const { error } = await supabase
          .from('project_documents')
          .insert([insertData]);

        if (error) throw error;
      }

      setShowForm(false);
      setFormData({
        title: '',
        category: 'Drawings'
      });
      loadDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      alert('Failed to save document. Please try again.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('project_documents')
        .update({
          workflow_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      loadDocuments();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'Approved': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'Rejected': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Under Review': return <Clock className="w-5 h-5 text-yellow-600" />;
      default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Document Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage project documents with version control and approval workflow
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600 mb-6">
            Start by adding your first document to track project documentation
          </p>
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                {getStatusIcon(doc.workflow_status)}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingDocument(doc)}
                    className="text-gray-400 hover:text-blue-600"
                    title="View details and comments"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditForm(doc)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-medium text-gray-900 mb-1">{doc.title}</h3>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Category:</span>
                  <span className="font-medium text-gray-700">{doc.category}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Status:</span>
                  <select
                    value={doc.workflow_status}
                    onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${getDocumentStatusColor(doc.workflow_status)}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {DOCUMENT_STATUSES.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                Updated {new Date(doc.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Document' : 'Add New Document'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Structural Drawing Rev A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DOCUMENT_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Upload className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">File Upload Coming Soon</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Document file upload functionality will be available in the next update. For now, you can track document metadata.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingId ? 'Update Document' : 'Create Document'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{viewingDocument.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{viewingDocument.category}</p>
              </div>
              <button
                onClick={() => setViewingDocument(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getDocumentStatusColor(viewingDocument.workflow_status)}`}>
                  {viewingDocument.workflow_status}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <History className="w-5 h-5 text-gray-600" />
                  <h4 className="text-sm font-medium text-gray-700">Version History</h4>
                </div>
                {loadingVersions ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  </div>
                ) : documentVersions.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No version history yet</p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {documentVersions.map((version) => (
                      <div key={version.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900">
                              Version {version.version_number}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getDocumentStatusColor(version.workflow_status)}`}>
                              {version.workflow_status}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(version.created_at).toLocaleString()}
                          </span>
                        </div>
                        {version.notes && (
                          <p className="text-xs text-gray-600 mt-1">{version.notes}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">By: {version.email || 'Unknown'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 text-gray-900">{new Date(viewingDocument.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="ml-2 text-gray-900">{new Date(viewingDocument.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <CommentsSection
                  entityType="document"
                  entityId={viewingDocument.id}
                  organizationId={organizationId}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
