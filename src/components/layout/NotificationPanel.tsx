import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import timeAgo from '@/lib/timeAgo';
import { CheckCheck } from 'lucide-react';

interface Notification {
  id: string; // text ID in Supabase
  message: string;
  type?: string;
  title?: string;
  link_to?: string; // mapped from route
  related_id?: string; // mapped from relatedId/orderId
  triggered_by?: string;
  created_at: string;
  is_read: boolean;
  // UI helpers
  route?: string;
  titleDisplay?: string;
}

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Initial fetch
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) {
        setNotifications(data.map(mapNotification));
      }
    };

    fetchNotifications();

    // Subscribe to changes
    const channel = supabase
      .channel('admin_notifications_panel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_notifications' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => [mapNotification(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              prev.map((n) => n.id === payload.new.id ? mapNotification(payload.new) : n)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const mapNotification = (data: any): Notification => ({
    ...data,
    route: data.link_to || data.route,
    titleDisplay: data.title
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationRoute = (notification: Notification) => {
    if (notification.route) return notification.route;
    if (notification.type === 'payment') return '/payments';
    if (notification.type === 'low_stock') return '/stock';
    if (notification.type === 'customer_created') return '/customers';
    if (notification.type === 'support_message') return '/customer-support';
    if (notification.type === 'order_chat_message') return '/order-chat-admin';
    if (notification.type === 'order_request') return '/admin/content?tab=order_requests';
    return '/orders';
  };

  const getNotificationTitle = (notification: Notification) => {
    if (notification.titleDisplay) return notification.titleDisplay;
    if (notification.title) return notification.title;
    if (notification.type === 'payment') return 'Payment';
    if (notification.type === 'low_stock') return 'Low Stock';
    if (notification.type === 'customer_created') return 'New Customer';
    if (notification.type === 'support_message') return 'Support';
    if (notification.type === 'order_chat_message') return 'Order Chat';
    if (notification.type === 'order_request') return 'Order Request';
    if (notification.related_id) return `Order #${notification.related_id} Status`;
    return 'Notification';
  };


  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await supabase
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      // Optimistic
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    }
    navigate(getNotificationRoute(notification));
    onClose();
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    // Optimistic
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  return (
    <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
      <div className="flex justify-between items-center p-3 border-b dark:border-gray-700">
        <h3 className="font-semibold">Notifications ({unreadCount})</h3>
        <button onClick={markAllAsRead} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No notifications yet.</p>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!notification.is_read ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
            >
              <p className="font-bold">{getNotificationTitle(notification)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {notification.created_at
                  ? timeAgo(notification.created_at)
                  : 'just now'}
              </p>
            </div>
          ))
        )}
      </div>
      <div className="p-2 text-center border-t dark:border-gray-700">
        <button onClick={onClose} className="text-sm text-gray-500 hover:underline">Close</button>
      </div>
    </div>
  );
};

export default NotificationPanel;
