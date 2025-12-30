import { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface TimeLog {
  id: string;
  user_id: string;
  log_date: string;
  hours_worked: number;
  description: string;
  created_at: string;
  email?: string;
}

interface TimeTrackingSectionProps {
  activityId: string;
  organizationId: string;
}

export default function TimeTrackingSection({ activityId, organizationId }: TimeTrackingSectionProps) {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    log_date: new Date().toISOString().split('T')[0],
    hours_worked: 0,
    description: ''
  });

  useEffect(() => {
    loadTimeLogs();
  }, [activityId]);

  async function loadTimeLogs() {
    try {
      const { data, error } = await supabase
        .from('activity_time_logs')
        .select('*')
        .eq('activity_id', activityId)
        .order('log_date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const { data: emails, error: emailsError } = await supabase.rpc('get_organization_members_with_emails', {
          org_id: organizationId
        });

        if (!emailsError && emails) {
          const logsWithEmails = data.map(log => ({
            ...log,
            email: emails.find((e: any) => e.user_id === log.user_id)?.email || 'Unknown'
          }));
          setTimeLogs(logsWithEmails);
        } else {
          setTimeLogs(data);
        }
      } else {
        setTimeLogs([]);
      }
    } catch (error) {
      console.error('Error loading time logs:', error);
    } finally {
      setLoading(false);
    }
  }

  function openAddForm() {
    setEditingId(null);
    setFormData({
      log_date: new Date().toISOString().split('T')[0],
      hours_worked: 0,
      description: ''
    });
    setShowForm(true);
  }

  function openEditForm(log: TimeLog) {
    setEditingId(log.id);
    setFormData({
      log_date: log.log_date,
      hours_worked: log.hours_worked,
      description: log.description || ''
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (formData.hours_worked <= 0 || formData.hours_worked > 24) {
      alert('Hours worked must be between 0 and 24');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (editingId) {
        const { error } = await supabase
          .from('activity_time_logs')
          .update({
            log_date: formData.log_date,
            hours_worked: formData.hours_worked,
            description: formData.description,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('activity_time_logs')
          .insert([{
            activity_id: activityId,
            organization_id: organizationId,
            user_id: user.id,
            log_date: formData.log_date,
            hours_worked: formData.hours_worked,
            description: formData.description
          }]);

        if (error) throw error;
      }

      setShowForm(false);
      loadTimeLogs();
    } catch (error: any) {
      console.error('Error saving time log:', error);
      alert(`Failed to save time log: ${error.message || 'Please try again.'}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this time log?')) return;

    try {
      const { error } = await supabase
        .from('activity_time_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadTimeLogs();
    } catch (error) {
      console.error('Error deleting time log:', error);
      alert('Failed to delete time log. Please try again.');
    }
  }

  const totalHours = timeLogs.reduce((sum, log) => sum + log.hours_worked, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-700" />
          <h3 className="font-medium text-gray-900">Time Tracking</h3>
          <span className="text-sm text-gray-600">
            ({totalHours.toFixed(2)} hrs total)
          </span>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Log Time
        </button>
      </div>

      {timeLogs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No time logged yet. Click "Log Time" to start tracking.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {timeLogs.map((log) => (
            <div key={log.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-sm text-gray-900">
                      {log.hours_worked} hrs
                    </span>
                    <span className="text-sm text-gray-600">
                      {new Date(log.log_date).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      by {log.email || 'Unknown'}
                    </span>
                  </div>
                  {log.description && (
                    <p className="text-sm text-gray-700 mt-1">{log.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditForm(log)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Time Log' : 'Log Time'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.log_date}
                  onChange={(e) => setFormData({ ...formData, log_date: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hours Worked *
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  value={formData.hours_worked}
                  onChange={(e) => setFormData({ ...formData, hours_worked: parseFloat(e.target.value) || 0 })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 8.5"
                />
                <p className="text-xs text-gray-500 mt-1">Enter hours (0.25 to 24)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What did you work on?"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
