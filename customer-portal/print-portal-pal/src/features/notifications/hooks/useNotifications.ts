import { useNotificationContext } from '@/features/notifications/context/NotificationContext';

export interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link_to?: string;
  user_id: string;
}

export const useNotifications = () => {
  return useNotificationContext();
};
