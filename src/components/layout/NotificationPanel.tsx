import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient'; // Firebase Firestore ஐ இறக்குமதி செய்யவும்
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import timeAgo from '@/lib/timeAgo';
import { CheckCheck } from 'lucide-react';

interface Notification {
  id: string;
  orderId: string;
  customerName: string;
  newStatus: string;
  message: string;
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


  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      const notifRef = doc(db, "notifications", notification.id);
      await updateDoc(notifRef, {
        read: true
      });
    }
    navigate(`/orders`); // Navigate to the orders page for now
    onClose();
  };

  const markAllAsRead = async () => {
    notifications.forEach(async (notification) => {
        if (!notification.read) {
            const notifRef = doc(db, "notifications", notification.id);
            await updateDoc(notifRef, {
                read: true
            });
        }
    });
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
      <div className="flex justify-between items-center p-3 border-b dark:border-gray-700">
        <h3 className="font-semibold">Notifications ({unreadCount})</h3>
        <button onClick={markAllAsRead} className="text-sm text-primary-600 hover:underline flex items-center gap-1">
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No notifications yet.</p>
        ) : (
          notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${!notification.read ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
            >
              <p className="font-bold">Order #{notification.orderId} Status</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{notification.message}</p>
              <p className="text-xs text-gray-400 mt-1">{notification.timestamp ? timeAgo(notification.timestamp.toDate()) : 'just now'}</p>
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
