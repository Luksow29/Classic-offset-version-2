import { useNotificationContext, Notification } from '@/context/NotificationContext';

export type { Notification };

export function useNotifications() {
  const context = useNotificationContext();
  return context;
}
