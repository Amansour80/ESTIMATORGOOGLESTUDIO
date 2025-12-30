import { supabase } from '../lib/supabase';
import { Inquiry, CreateInquiryInput, UpdateInquiryInput, InquiryStats } from '../types/inquiry';

export async function getOrganizationInquiries(organizationId: string): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching inquiries:', error);
    throw error;
  }

  return data || [];
}

export async function getInquiryById(inquiryId: string): Promise<Inquiry | null> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('id', inquiryId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching inquiry:', error);
    throw error;
  }

  return data;
}

export async function createInquiry(
  organizationId: string,
  userId: string,
  input: CreateInquiryInput
): Promise<Inquiry> {
  const { data, error } = await supabase
    .from('inquiries')
    .insert({
      organization_id: organizationId,
      created_by: userId,
      inquiry_number: '',
      ...input,
      status: 'new'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating inquiry:', error);
    throw error;
  }

  return data;
}

export async function updateInquiry(
  inquiryId: string,
  updates: UpdateInquiryInput
): Promise<Inquiry> {
  const { data, error } = await supabase
    .from('inquiries')
    .update(updates)
    .eq('id', inquiryId)
    .select()
    .single();

  if (error) {
    console.error('Error updating inquiry:', error);
    throw error;
  }

  return data;
}

export async function deleteInquiry(inquiryId: string): Promise<void> {
  const { error } = await supabase
    .from('inquiries')
    .delete()
    .eq('id', inquiryId);

  if (error) {
    console.error('Error deleting inquiry:', error);
    throw error;
  }
}

export async function markInquiryAsConverted(
  inquiryId: string,
  projectId: string,
  projectType: 'hk' | 'fm' | 'retrofit'
): Promise<Inquiry> {
  const { data, error } = await supabase
    .from('inquiries')
    .update({
      status: 'converted',
      converted_to_project_id: projectId,
      converted_to_project_type: projectType
    })
    .eq('id', inquiryId)
    .select()
    .single();

  if (error) {
    console.error('Error marking inquiry as converted:', error);
    throw error;
  }

  return data;
}

export async function getInquiryStats(organizationId: string): Promise<InquiryStats> {
  const { data: inquiries, error } = await supabase
    .from('inquiries')
    .select('status, deadline')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching inquiry stats:', error);
    throw error;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const stats: InquiryStats = {
    total: inquiries.length,
    new: 0,
    in_review: 0,
    converted: 0,
    lost: 0,
    expired: 0,
    overdue: 0,
    due_this_week: 0
  };

  inquiries.forEach(inquiry => {
    switch (inquiry.status) {
      case 'new':
        stats.new++;
        break;
      case 'in_review':
        stats.in_review++;
        break;
      case 'converted':
        stats.converted++;
        break;
      case 'lost':
        stats.lost++;
        break;
      case 'expired':
        stats.expired++;
        break;
    }

    const deadline = new Date(inquiry.deadline);
    deadline.setHours(0, 0, 0, 0);

    if (deadline < today && inquiry.status !== 'converted' && inquiry.status !== 'lost' && inquiry.status !== 'expired') {
      stats.overdue++;
    }

    if (deadline >= today && deadline <= nextWeek && inquiry.status !== 'converted' && inquiry.status !== 'lost' && inquiry.status !== 'expired') {
      stats.due_this_week++;
    }
  });

  return stats;
}

export async function getUserAssignedInquiries(userId: string): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('assigned_to', userId)
    .in('status', ['new', 'in_review'])
    .order('deadline', { ascending: true });

  if (error) {
    console.error('Error fetching user inquiries:', error);
    throw error;
  }

  return data || [];
}

export async function getOverdueInquiries(organizationId: string): Promise<Inquiry[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('organization_id', organizationId)
    .lt('deadline', today)
    .in('status', ['new', 'in_review'])
    .order('deadline', { ascending: true});

  if (error) {
    console.error('Error fetching overdue inquiries:', error);
    throw error;
  }

  return data || [];
}

export async function clearInquiryConversion(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('inquiries')
    .update({
      status: 'in_review',
      converted_to_project_id: null,
      converted_to_project_type: null,
      updated_at: new Date().toISOString()
    })
    .eq('converted_to_project_id', projectId);

  if (error) {
    console.error('Error clearing inquiry conversion:', error);
    throw error;
  }
}
