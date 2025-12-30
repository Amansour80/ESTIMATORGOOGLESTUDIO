import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getUnreadCount } from '../utils/notificationDatabase';

interface NotificationBellProps {
  onClick?: () => void;
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUnreadCount();

    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onClick}
      className="relative p-3 bg-white text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
      title="Notifications"
    >
      <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5 shadow-md animate-bounce">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
