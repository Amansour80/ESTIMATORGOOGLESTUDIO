import { supabase } from '../lib/supabase';

export interface UserNotification {
  id: string;
  user_id: string;
  organization_id: string;
  notification_type: 'approval_approved' | 'approval_rejected' | 'revision_requested' | 'submitted_for_approval' | 'approval_required' | 'missing_asset_library' | 'activity_assigned' | 'activity_status_changed' | 'issue_assigned' | 'document_uploaded' | 'comment_added';
  title: string;
  message: string;
  project_id: string | null;
  project_type: 'hk' | 'fm' | 'retrofit' | null;
  project_name: string | null;
  approval_id: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export async function getNotifications(): Promise<UserNotification[]> {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getUnreadNotifications(): Promise<UserNotification[]> {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getUnreadCount(): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_unread_notification_count');

  if (error) throw error;
  return data || 0;
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .rpc('mark_notification_read', { p_notification_id: notificationId });

  if (error) throw error;
}

export async function markAllAsRead(): Promise<void> {
  const { error } = await supabase
    .rpc('mark_all_notifications_read');

  if (error) throw error;
}

export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('user_notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}

export async function deleteAllNotifications(): Promise<void> {
  const { error } = await supabase
    .from('user_notifications')
    .delete()
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

  if (error) throw error;
}

export async function createNotification(
  userId: string,
  organizationId: string,
  notificationType: UserNotification['notification_type'],
  title: string,
  message: string,
  projectId?: string,
  projectType?: 'hk' | 'fm' | 'retrofit',
  projectName?: string,
  approvalId?: string,
  metadata?: Record<string, any>
): Promise<string> {
  const { data, error } = await supabase
    .rpc('create_notification', {
      p_user_id: userId,
      p_organization_id: organizationId,
      p_notification_type: notificationType,
      p_title: title,
      p_message: message,
      p_project_id: projectId || null,
      p_project_type: projectType || null,
      p_project_name: projectName || null,
      p_approval_id: approvalId || null,
      p_metadata: metadata || {}
    });

  if (error) throw error;
  return data;
}

export function getNotificationIcon(type: UserNotification['notification_type']): string {
  switch (type) {
    case 'approval_approved':
      return '✓';
    case 'approval_rejected':
      return '✗';
    case 'revision_requested':
      return '↻';
    case 'approval_required':
      return '!';
    case 'submitted_for_approval':
      return '→';
    case 'missing_asset_library':
      return '⚠';
    case 'activity_assigned':
      return '📋';
    case 'activity_status_changed':
      return '🔄';
    case 'issue_assigned':
      return '🐛';
    case 'document_uploaded':
      return '📄';
    case 'comment_added':
      return '💬';
    default:
      return '•';
  }
}

export function getNotificationColor(type: UserNotification['notification_type']): string {
  switch (type) {
    case 'approval_approved':
      return 'green';
    case 'approval_rejected':
      return 'red';
    case 'revision_requested':
      return 'yellow';
    case 'approval_required':
      return 'blue';
    case 'submitted_for_approval':
      return 'gray';
    case 'missing_asset_library':
      return 'yellow';
    case 'activity_assigned':
      return 'blue';
    case 'activity_status_changed':
      return 'green';
    case 'issue_assigned':
      return 'red';
    case 'document_uploaded':
      return 'blue';
    case 'comment_added':
      return 'gray';
    default:
      return 'gray';
  }
}
