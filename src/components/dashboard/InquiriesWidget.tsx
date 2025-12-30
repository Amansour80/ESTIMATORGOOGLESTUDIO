import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, ArrowRight, TrendingUp } from 'lucide-react';
import { Inquiry, InquiryStats } from '../../types/inquiry';
import { getInquiryStats, getOverdueInquiries } from '../../utils/inquiryDatabase';
import { useOrganization } from '../../contexts/OrganizationContext';

interface InquiriesWidgetProps {
  onNavigateToInquiries: () => void;
}

export function InquiriesWidget({ onNavigateToInquiries }: InquiriesWidgetProps) {
  const { currentOrganization } = useOrganization();
  const [stats, setStats] = useState<InquiryStats | null>(null);
  const [overdueInquiries, setOverdueInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization) {
      loadData();
    }
  }, [currentOrganization]);

  const loadData = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const [statsData, overdueData] = await Promise.all([
        getInquiryStats(currentOrganization.id),
        getOverdueInquiries(currentOrganization.id)
      ]);
      setStats(statsData);
      setOverdueInquiries(overdueData.slice(0, 3));
    } catch (error) {
      console.error('Error loading inquiry data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  const activeInquiries = stats.new + stats.in_review;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Inquiries Pipeline</h3>
              <p className="text-sm text-gray-500">Track and manage project inquiries</p>
            </div>
          </div>
          <button
            onClick={onNavigateToInquiries}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            View All <ArrowRight size={16} />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{activeInquiries}</p>
            <p className="text-xs text-gray-600 mt-1">Active</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
            <p className="text-xs text-gray-600 mt-1">Converted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-xs text-gray-600 mt-1">Overdue</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.due_this_week}</p>
            <p className="text-xs text-gray-600 mt-1">Due This Week</p>
          </div>
        </div>

        {overdueInquiries.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="text-red-600" size={18} />
              <h4 className="text-sm font-semibold text-gray-900">Overdue Inquiries</h4>
            </div>
            <div className="space-y-2">
              {overdueInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                  onClick={onNavigateToInquiries}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {inquiry.inquiry_number} - {inquiry.client_name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{inquiry.project_name}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Calendar className="text-red-600" size={14} />
                    <span className="text-xs text-red-600 font-medium whitespace-nowrap">
                      {new Date(inquiry.deadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeInquiries === 0 && overdueInquiries.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500 text-sm">No active inquiries</p>
            <button
              onClick={onNavigateToInquiries}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Create your first inquiry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
