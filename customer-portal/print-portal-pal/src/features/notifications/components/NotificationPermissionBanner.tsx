// Component to request browser notification permission
import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationPermissionBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      return;
    }

    setPermission(Notification.permission);

    // Show banner if permission not yet requested
    if (Notification.permission === 'default') {
      // Check if user has dismissed the banner before
      const dismissed = localStorage.getItem('notification-banner-dismissed');
      if (!dismissed) {
        // Small delay to not overwhelm user immediately
        const timer = setTimeout(() => setShow(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const requestPermission = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      setShow(false);
      
      if (result === 'granted') {
        // Show a test notification
        new Notification('Notifications Enabled! 🎉', {
          body: 'You will now receive updates about your orders.',
          icon: '/icons/icon-192x192.png',
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const dismiss = () => {
    setShow(false);
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  if (!show || permission !== 'default') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 shadow-lg"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">Enable Push Notifications</p>
              <p className="text-xs text-blue-100">Get instant updates about your orders and messages</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={requestPermission}
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Enable
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={dismiss}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPermissionBanner;
