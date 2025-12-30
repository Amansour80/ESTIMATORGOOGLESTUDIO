import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, AlertCircle, Clock, ClipboardList, Activity, Bug, FileText, MessageSquare } from 'lucide-react';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  UserNotification,
  getNotificationColor
} from '../utils/notificationDatabase';

interface NotificationsProps {
  onNavigate?: (tab: string, projectId?: string) => void;
}

export default function Notifications({ onNavigate }: NotificationsProps = {}) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString()
      })));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Delete all notifications? This cannot be undone.')) {
      return;
    }
    try {
      await deleteAllNotifications();
      setNotifications([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete all notifications');
    }
  };

  const handleNotificationClick = (notification: UserNotification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    if (onNavigate) {
      if (notification.notification_type === 'approval_required') {
        onNavigate('approvals');
      } else if (notification.project_id && notification.project_type) {
        if (notification.notification_type === 'revision_requested') {
          onNavigate(notification.project_type, notification.project_id);
        } else {
          onNavigate('dashboard');
        }
      }
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-8 h-8 text-blue-600" />
            Notifications
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete all
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </p>
          <p className="text-sm text-gray-500">
            {filter === 'unread' ? 'All caught up!' : 'Notifications will appear here when projects require action'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
              onMarkAsRead={() => handleMarkAsRead(notification.id)}
              onDelete={() => handleDelete(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationCard({
  notification,
  onClick,
  onMarkAsRead,
  onDelete
}: {
  notification: UserNotification;
  onClick: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}) {
  const color = getNotificationColor(notification.notification_type);
  const isUnread = !notification.is_read;

  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    gray: 'bg-gray-50 border-gray-200 text-gray-800'
  };

  const iconColorClasses = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    blue: 'bg-blue-100 text-blue-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md ${
        isUnread ? 'bg-white border-gray-300 shadow-sm' : 'bg-gray-50 border-gray-200'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColorClasses[color]}`}>
          {notification.notification_type === 'approval_approved' && <Check className="w-5 h-5" />}
          {notification.notification_type === 'approval_rejected' && <AlertCircle className="w-5 h-5" />}
          {notification.notification_type === 'revision_requested' && <Clock className="w-5 h-5" />}
          {notification.notification_type === 'approval_required' && <Bell className="w-5 h-5" />}
          {notification.notification_type === 'activity_assigned' && <ClipboardList className="w-5 h-5" />}
          {notification.notification_type === 'activity_status_changed' && <Activity className="w-5 h-5" />}
          {notification.notification_type === 'issue_assigned' && <Bug className="w-5 h-5" />}
          {notification.notification_type === 'document_uploaded' && <FileText className="w-5 h-5" />}
          {notification.notification_type === 'comment_added' && <MessageSquare className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className={`font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
              {notification.title}
            </h3>
            <div className="flex items-center gap-2">
              {isUnread && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead();
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex-shrink-0"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Delete this notification?')) {
                    onDelete();
                  }
                }}
                className="text-gray-400 hover:text-red-600 text-sm font-medium flex-shrink-0 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className={`text-sm mb-2 ${isUnread ? 'text-gray-700' : 'text-gray-600'}`}>
            {notification.message}
          </p>

          {notification.metadata?.comments && (
            <div className={`text-sm p-3 rounded-lg border mt-2 ${colorClasses[color]}`}>
              <p className="font-medium mb-1">Comments:</p>
              <p className="italic">{notification.metadata.comments}</p>
            </div>
          )}

          {notification.project_name && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                {notification.project_type?.toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">{notification.project_name}</span>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            {new Date(notification.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
