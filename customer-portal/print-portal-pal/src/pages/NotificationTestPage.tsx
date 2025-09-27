import React from 'react';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';

const NotificationTestPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Push Notification Test
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Test and configure push notifications for your account
          </p>
        </div>

        <div className="flex justify-center">
          <NotificationSettings />
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Testing Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
            <li>Click "Enable Notifications" to request permission</li>
            <li>Allow notifications when prompted by your browser</li>
            <li>Once subscribed, click "Send Test" to verify notifications work</li>
            <li>Check that the notification appears and clicking it brings you back to the app</li>
            <li>You can disable notifications at any time</li>
          </ol>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">
            What Notifications Include
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-green-800 dark:text-green-200">Order Updates</h4>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• Order confirmed</li>
                <li>• In production</li>
                <li>• Ready for delivery</li>
                <li>• Delivered</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-green-800 dark:text-green-200">Communications</h4>
              <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <li>• New chat messages</li>
                <li>• Support responses</li>
                <li>• Payment reminders</li>
                <li>• Special offers</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPage;
