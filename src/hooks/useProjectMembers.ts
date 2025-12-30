import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ProjectMember {
  id: string;
  user_id: string;
  role: string;
  email?: string;
  created_at?: string;
}

export function useProjectMembers(projectId: string, organizationId: string) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, [projectId, organizationId]);

  async function loadMembers() {
    try {
      setLoading(true);
      setError(null);

      const { data: membersData, error: membersError } = await supabase
        .from('project_members')
        .select('id, user_id, role, created_at')
        .eq('retrofit_project_id', projectId);

      if (membersError) throw membersError;

      if (membersData && membersData.length > 0) {
        const { data: emailsData, error: emailsError } = await supabase.rpc(
          'get_organization_members_with_emails',
          { org_id: organizationId }
        );

        if (!emailsError && emailsData) {
          const membersWithEmails = membersData.map((member) => ({
            ...member,
            email: emailsData.find((e: any) => e.user_id === member.user_id)?.email || 'Unknown'
          }));
          setMembers(membersWithEmails);
        } else {
          setMembers(membersData);
        }
      } else {
        setMembers([]);
      }
    } catch (err: any) {
      console.error('Error loading project members:', err);
      setError(err.message || 'Failed to load project members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  return { members, loading, error, reload: loadMembers };
}
