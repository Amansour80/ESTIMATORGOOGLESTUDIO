import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Clock, AlertCircle, TrendingUp, CheckSquare, FileText, Users, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  action: () => void;
  priority: 'high' | 'medium' | 'low';
  category: 'action' | 'review' | 'info';
}

interface SmartNavigationSuggestionsProps {
  user: User;
  onNavigate: (tab: string, id?: string) => void;
}

export default function SmartNavigationSuggestions({ user, onNavigate }: SmartNavigationSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadSuggestions();
    const interval = setInterval(loadSuggestions, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const newSuggestions: Suggestion[] = [];

      const [
        allPendingApprovals,
        draftProjects,
        recentActivity,
        unreadNotifications,
      ] = await Promise.all([
        supabase
          .from('project_approvals')
          .select('id, project_type, project_id, current_node_id, workflow_id')
          .eq('status', 'pending')
          .not('current_node_id', 'is', null)
          .limit(10),

        Promise.all([
          supabase.from('hk_projects').select('id, project_name, updated_at').eq('status', 'DRAFT').order('updated_at', { ascending: false }).limit(3),
          supabase.from('fm_projects').select('id, project_name, updated_at').eq('status', 'DRAFT').order('updated_at', { ascending: false }).limit(3),
          supabase.from('retrofit_projects').select('id, project_name, updated_at').eq('status', 'DRAFT').order('updated_at', { ascending: false }).limit(3),
        ]),

        Promise.all([
          supabase.from('hk_projects').select('id, project_name, updated_at').order('updated_at', { ascending: false }).limit(1),
          supabase.from('fm_projects').select('id, project_name, updated_at').order('updated_at', { ascending: false }).limit(1),
          supabase.from('retrofit_projects').select('id, project_name, updated_at').order('updated_at', { ascending: false }).limit(1),
        ]),

        supabase
          .from('user_notifications')
          .select('id', { count: 'exact', head: true })
          .eq('is_read', false),
      ]);

      // Filter approvals to only show ones the user can actually approve
      const userApprovableCount = allPendingApprovals.data
        ? await Promise.all(
            allPendingApprovals.data.map(async (approval) => {
              try {
                const { data } = await supabase.rpc('can_user_approve_at_node', {
                  p_approval_id: approval.id,
                  p_user_id: user.id
                });
                return data === true;
              } catch (error) {
                console.error('Error checking approval permission:', error);
                return false;
              }
            })
          ).then(results => results.filter(Boolean).length)
        : 0;

      if (userApprovableCount > 0) {
        newSuggestions.push({
          id: 'pending-approvals',
          title: `${userApprovableCount} Pending Approval${userApprovableCount > 1 ? 's' : ''}`,
          description: 'Projects waiting for your review and approval',
          icon: CheckSquare,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          action: () => onNavigate('approvals'),
          priority: 'high',
          category: 'action',
        });
      }

      const allDrafts = [
        ...(draftProjects[0].data || []).map(p => ({ ...p, type: 'hk' })),
        ...(draftProjects[1].data || []).map(p => ({ ...p, type: 'fm' })),
        ...(draftProjects[2].data || []).map(p => ({ ...p, type: 'retrofit' })),
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      if (allDrafts.length > 0) {
        const oldestDraft = allDrafts[allDrafts.length - 1];
        const daysSinceUpdate = Math.floor(
          (Date.now() - new Date(oldestDraft.updated_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceUpdate > 3) {
          newSuggestions.push({
            id: 'old-drafts',
            title: `${allDrafts.length} Draft Projects`,
            description: `Oldest draft hasn't been updated in ${daysSinceUpdate} days`,
            icon: FileText,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
            action: () => onNavigate(oldestDraft.type, oldestDraft.id),
            priority: 'medium',
            category: 'review',
          });
        }
      }

      if (unreadNotifications.count && unreadNotifications.count > 0) {
        newSuggestions.push({
          id: 'unread-notifications',
          title: `${unreadNotifications.count} Unread Notifications`,
          description: 'Stay updated with recent activity and alerts',
          icon: AlertCircle,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          action: () => onNavigate('notifications'),
          priority: 'medium',
          category: 'info',
        });
      }

      const allRecent = [
        ...(recentActivity[0].data || []).map(p => ({ ...p, type: 'hk' })),
        ...(recentActivity[1].data || []).map(p => ({ ...p, type: 'fm' })),
        ...(recentActivity[2].data || []).map(p => ({ ...p, type: 'retrofit' })),
      ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

      if (allRecent.length > 0) {
        const mostRecent = allRecent[0];
        const minutesSinceUpdate = Math.floor(
          (Date.now() - new Date(mostRecent.updated_at).getTime()) / (1000 * 60)
        );

        if (minutesSinceUpdate < 30) {
          newSuggestions.push({
            id: 'continue-work',
            title: 'Continue Where You Left Off',
            description: `Resume work on "${mostRecent.project_name}"`,
            icon: Clock,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
            action: () => onNavigate(mostRecent.type, mostRecent.id),
            priority: 'high',
            category: 'action',
          });
        }
      }

      const hour = new Date().getHours();
      if (hour >= 9 && hour < 11) {
        newSuggestions.push({
          id: 'morning-check',
          title: 'Morning Dashboard Review',
          description: 'Check your analytics and project metrics',
          icon: TrendingUp,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-100',
          action: () => onNavigate('dashboard'),
          priority: 'low',
          category: 'info',
        });
      }

      const { count: inquiryCount } = await supabase
        .from('inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'NEW');

      if (inquiryCount && inquiryCount > 0) {
        newSuggestions.push({
          id: 'new-inquiries',
          title: `${inquiryCount} New Inquiries`,
          description: 'Convert inquiries to projects',
          icon: Users,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          action: () => onNavigate('inquiries'),
          priority: 'high',
          category: 'action',
        });
      }

      const sortedSuggestions = newSuggestions.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      setSuggestions(sortedSuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (suggestionId: string) => {
    setDismissed(prev => new Set([...prev, suggestionId]));
  };

  const visibleSuggestions = suggestions.filter(s => !dismissed.has(s.id)).slice(0, 4);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-600">Loading suggestions...</span>
        </div>
      </div>
    );
  }

  if (visibleSuggestions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Smart Suggestions</h3>
        </div>
        <div className="text-center py-8">
          <Zap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">All caught up! No suggestions at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Smart Suggestions</h3>
          <p className="text-sm text-gray-600">Recommended actions based on your activity</p>
        </div>
      </div>

      <div className="space-y-3">
        {visibleSuggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          const priorityBadge = {
            high: { label: 'High Priority', color: 'bg-red-100 text-red-700' },
            medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
            low: { label: 'Low', color: 'bg-gray-100 text-gray-700' },
          };

          return (
            <button
              key={suggestion.id}
              onClick={suggestion.action}
              className="w-full p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group text-left"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 ${suggestion.bgColor} rounded-lg group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-6 h-6 ${suggestion.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityBadge[suggestion.priority].color}`}>
                      {priorityBadge[suggestion.priority].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{suggestion.description}</p>
                </div>

                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-3" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={loadSuggestions}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 mx-auto"
        >
          <Sparkles className="w-4 h-4" />
          Refresh Suggestions
        </button>
      </div>
    </div>
  );
}
