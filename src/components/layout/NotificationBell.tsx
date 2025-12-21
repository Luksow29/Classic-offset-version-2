import React from 'react';
import { Bell, BellRing, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useUser } from '@/context/UserContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Button from '@/components/ui/Button';

const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  const { user } = useUser();
  const { isSupported, isSubscribed, subscribeToPush, loading } = usePushNotifications(user?.id);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 block transition-colors">
          {unreadCount > 0 ? <BellRing className="text-primary-500 w-6 h-6" /> : <Bell className="w-6 h-6" />}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          <Link to="/notifications" className="text-xs text-primary-500 hover:underline">
            View All
          </Link>
        </div>

        <div className="p-4 space-y-4">
          {/* Push Notification Toggle */}
          {isSupported && !isSubscribed && (
            <div className="bg-primary-50 dark:bg-primary-900/10 p-3 rounded-lg flex flex-col gap-2">
              <p className="text-sm font-medium text-primary-900 dark:text-primary-100">
                Don't miss updates
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Enable push notifications to get instant alerts about your orders.
              </p>
              <Button
                size="sm"
                onClick={subscribeToPush}
                disabled={loading}
                className="w-full mt-1"
              >
                {loading ? 'Enabling...' : 'Enable Notifications'}
              </Button>
            </div>
          )}

          <div className="space-y-1">
            <Link
              to="/notifications"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Notifications</p>
                <p className="text-xs text-gray-500">View all your alerts</p>
              </div>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/settings"
              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                <Settings className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Preferences</p>
                <p className="text-xs text-gray-500">Manage notification types</p>
              </div>
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
