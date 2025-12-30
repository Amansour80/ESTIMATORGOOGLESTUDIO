import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '../contexts/OrganizationContext';
import { supabase } from '../lib/supabase';

export interface FeatureLimits {
  max_projects: number | null;
  max_inquiries_per_month: number | null;
  max_users: number | null;
  has_watermark: boolean;
  can_export_excel: boolean;
  can_use_workflows: boolean;
  can_use_dashboard: boolean;
  can_use_comparison: boolean;
  can_manage_libraries: boolean;
  data_retention_days: number | null;
}

export interface UsageData {
  projects_count: number;
  inquiries_count: number;
  last_inquiry_reset: string;
  limits: FeatureLimits;
}

export function useUsageLimits() {
  const { organization } = useOrganization();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!organization?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .rpc('get_organization_usage', { org_id: organization.id });

      if (fetchError) throw fetchError;

      setUsage(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch usage');
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const canCreateProject = useCallback(async (): Promise<boolean> => {
    if (!organization?.id) return false;

    try {
      const { data, error } = await supabase
        .rpc('check_project_limit', { org_id: organization.id });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error checking project limit:', err);
      return false;
    }
  }, [organization?.id]);

  const canCreateInquiry = useCallback(async (): Promise<boolean> => {
    if (!organization?.id) return false;

    try {
      const { data, error } = await supabase
        .rpc('check_inquiry_limit', { org_id: organization.id });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error checking inquiry limit:', err);
      return false;
    }
  }, [organization?.id]);

  const isFeatureAvailable = useCallback((feature: keyof FeatureLimits): boolean => {
    if (!usage?.limits) return true;
    const featureValue = usage.limits[feature];
    if (typeof featureValue === 'boolean') {
      return featureValue;
    }
    return true;
  }, [usage]);

  const getProjectsRemaining = useCallback((): number | null => {
    if (!usage?.limits) return null;
    const maxProjects = usage.limits.max_projects;
    if (maxProjects === null) return null;
    return Math.max(0, maxProjects - usage.projects_count);
  }, [usage]);

  const getInquiriesRemaining = useCallback((): number | null => {
    if (!usage?.limits) return null;
    const maxInquiries = usage.limits.max_inquiries_per_month;
    if (maxInquiries === null) return null;
    return Math.max(0, maxInquiries - usage.inquiries_count);
  }, [usage]);

  const isOnFreePlan = useCallback((): boolean => {
    if (!usage?.limits) return false;
    return usage.limits.max_projects === 3 && usage.limits.max_users === 1;
  }, [usage]);

  const getProjectLimitMessage = useCallback((): string => {
    if (!usage?.limits) return 'Loading...';
    const remaining = getProjectsRemaining();
    if (remaining === null) return 'Unlimited projects';
    if (remaining === 0) return 'Project limit reached';
    if (remaining === 1) return 'Last project available';
    return `${remaining} projects remaining`;
  }, [usage, getProjectsRemaining]);

  const getInquiryLimitMessage = useCallback((): string => {
    if (!usage?.limits) return 'Loading...';
    const remaining = getInquiriesRemaining();
    if (remaining === null) return 'Unlimited inquiries';
    if (remaining === 0) return 'Monthly inquiry limit reached';
    return `${remaining} inquiries remaining this month`;
  }, [usage, getInquiriesRemaining]);

  const canInviteUsers = useCallback((): boolean => {
    if (!usage?.limits) return true;
    const maxUsers = usage.limits.max_users;
    return maxUsers === null || maxUsers > 1;
  }, [usage]);

  return {
    usage,
    loading,
    error,
    canCreateProject,
    canCreateInquiry,
    canInviteUsers,
    isFeatureAvailable,
    getProjectsRemaining,
    getInquiriesRemaining,
    isOnFreePlan,
    getProjectLimitMessage,
    getInquiryLimitMessage,
    refreshUsage: fetchUsage,
  };
}
