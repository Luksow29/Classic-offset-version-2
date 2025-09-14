// src/components/dashboard/ActivityLogFeed.tsx
import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import timeAgo from '@/lib/timeAgo';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';

// Correctly import individual icons from lucide-react
import List from 'lucide-react/dist/esm/icons/list';
import Activity from 'lucide-react/dist/esm/icons/activity';
import User from 'lucide-react/dist/esm/icons/user';
import Clock from 'lucide-react/dist/esm/icons/clock';


interface ActivityLog {
  id: string;
  message: string;
  user: string;
  timestamp: any;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
    },
  },
};


const ActivityLogFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "activity_logs"), orderBy("timestamp", "desc"), limit(15));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const activitiesData: ActivityLog[] = [];
      querySnapshot.forEach((doc) => {
        activitiesData.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      setActivities(activitiesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Card>
        <div className="p-4 text-center font-sans font-medium text-gray-600 dark:text-gray-300">Loading Activities...</div>
      </Card>
    );
  }

  return (
    <Card>
        <div className="p-4 border-b dark:border-gray-700 flex items-center gap-2">
            <List size={18} />
            <h3 className="font-display font-semibold tracking-tight">Live Team Activity</h3>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
        {activities.length === 0 ? (
          <p className="p-4 text-center text-gray-500 font-sans font-medium">No recent activities.</p>
        ) : (
          <motion.ul 
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {activities.map(activity => (
              <motion.li 
                key={activity.id} 
                className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50"
                variants={itemVariants}
              >
                <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                    <Activity size={16} className="text-gray-500"/>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-sans text-gray-800 dark:text-gray-200 leading-relaxed">{activity.message}</p>
                    <div className="flex items-center gap-4 text-xs font-sans font-medium text-gray-500 dark:text-gray-400 mt-1 tracking-wide">
                        <div className="flex items-center gap-1.5"><User size={12}/> {activity.user}</div>
                        <div className="flex items-center gap-1.5"><Clock size={12}/> {activity.timestamp ? timeAgo(activity.timestamp.toDate()) : 'just now'}</div>
                    </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </Card>
  );
};

export default ActivityLogFeed;
