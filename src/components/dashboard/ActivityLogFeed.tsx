// src/components/dashboard/ActivityLogFeed.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import timeAgo from '@/lib/timeAgo';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';

// Correctly import individual icons from lucide-react
// Correctly import individual icons from lucide-react
import { List, Activity, User, Clock } from 'lucide-react';


interface ActivityLog {
  id: string;
  action_type: string;
  details: {
    message?: string;
    user_name?: string;
  };
  created_at: string;
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
    const fetchActivities = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (data) setActivities(data as ActivityLog[]);
      setLoading(false);
    };

    fetchActivities();

    const channel = supabase
      .channel('activity_logs_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          setActivities((prev) => [payload.new as ActivityLog, ...prev.slice(0, 14)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      <div className="p-2 sm:p-4 border-b dark:border-gray-700 flex items-center gap-2">
        <List size={16} />
        <h3 className="font-display font-semibold text-sm sm:text-base tracking-tight">Live Team Activity</h3>
      </div>
      <div className="max-h-64 sm:max-h-96 overflow-y-auto p-1 sm:p-2">
        {activities.length === 0 ? (
          <p className="p-4 text-center text-gray-500 font-sans font-medium text-sm">No recent activities.</p>
        ) : (
          <motion.ul
            className="space-y-1.5 sm:space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {activities.map(activity => (
              <motion.li
                key={activity.id}
                className="flex items-start gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50"
                variants={itemVariants}
              >
                <div className="bg-gray-100 dark:bg-gray-700 p-1.5 sm:p-2 rounded-full">
                  <Activity size={12} className="text-gray-500 sm:w-4 sm:h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-sans text-gray-800 dark:text-gray-200 leading-snug truncate">{activity.details?.message || 'Activity performed'}</p>
                  <div className="flex items-center gap-2 sm:gap-4 text-[10px] sm:text-xs font-sans font-medium text-gray-500 dark:text-gray-400 mt-0.5 tracking-wide">
                    <div className="flex items-center gap-1"><User size={10} /> {activity.details?.user_name || 'System'}</div>
                    <div className="flex items-center gap-1"><Clock size={10} /> {activity.created_at ? timeAgo(activity.created_at) : 'just now'}</div>
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
