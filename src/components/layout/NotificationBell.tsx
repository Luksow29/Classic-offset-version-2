import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Bell, BellRing } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { Link } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "notifications"), where("read", "==", false));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      setUnreadCount(querySnapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <Link to="/notifications" className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 block">
      {unreadCount > 0 ? <BellRing className="text-primary-500" /> : <Bell />}
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
