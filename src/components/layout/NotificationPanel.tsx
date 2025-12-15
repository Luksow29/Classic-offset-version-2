import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient'; // Firebase Firestore ஐ இறக்குமதி செய்யவும்
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import timeAgo from '@/lib/timeAgo';
import { CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  message: string;
  type?: string;
  title?: string;
  route?: string;
  relatedId?: string | number;
  orderId?: string | number;
  customerName?: string;
  newStatus?: string;
  triggeredBy?: string;
  updatedBy?: string;
  timestamp: any;
  read: boolean;
}

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsData: Notification[] = [];
      querySnapshot.forEach((doc) => {
        notificationsData.push({ id: doc.id, ...doc.data() } as Notification);
      });
      setNotifications(notificationsData);
    });

    return () => unsubscribe();
  }, []);
  
  const unreadCount = notifications.filter(n => !n.read).length;

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
    if (notification.title) return notification.title;
    if (notification.type === 'payment') return 'Payment';
    if (notification.type === 'low_stock') return 'Low Stock';
    if (notification.type === 'customer_created') return 'New Customer';
    if (notification.type === 'support_message') return 'Support';
    if (notification.type === 'order_chat_message') return 'Order Chat';
    if (notification.type === 'order_request') return 'Order Request';
    if (notification.orderId) return `Order #${notification.orderId} Status`;
    return 'Notification';
  };


  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      const notifRef = doc(db, "notifications", notification.id);
      await updateDoc(notifRef, {
        read: true
      });
    }
    navigate(getNotificationRoute(notification));
    onClose();
  };

  const markAllAsRead = async () => {
    await Promise.all(
      notifications
        .filter((notification) => !notification.read)
        .map((notification) => updateDoc(doc(db, "notifications", notification.id), { read: true }))
    );
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
              className={`p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!notification.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
            >
              <p className="font-bold">{getNotificationTitle(notification)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {notification.timestamp
                  ? timeAgo(typeof notification.timestamp?.toDate === 'function' ? notification.timestamp.toDate() : notification.timestamp)
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
