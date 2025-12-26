import React from 'react';
import { useNavigate } from 'react-router-dom';
import timeAgo from '@/lib/timeAgo';
import { CheckCheck, Bell } from 'lucide-react';
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useNotifications, Notification } from '@/hooks/useNotifications';

interface NotificationViewModel extends Notification {
    route?: string;
    orderId?: string;
    titleDisplay?: string;
}

const NotificationsPage: React.FC = () => {
    const { notifications: rawNotifications, markAllAsRead, markAsRead } = useNotifications();
    const navigate = useNavigate();

    // Map raw notifications to UI model
    const notifications: NotificationViewModel[] = rawNotifications.map(n => ({
        ...n,
        route: n.link_to,
        orderId: n.related_id,
        titleDisplay: n.title
    }));

    const getNotificationRoute = (notification: NotificationViewModel) => {
        if (notification.route) return notification.route;
        if (notification.type === 'payment') return '/payments';
        if (notification.type === 'low_stock') return '/stock';
        if (notification.type === 'customer_created') return '/customers';
        if (notification.type === 'support_message') return '/customer-support';
        if (notification.type === 'order_chat_message') return '/order-chat-admin';
        if (notification.type === 'order_request') return '/admin/content?tab=order_requests';
        return '/orders';
    };

    const getNotificationTitle = (notification: NotificationViewModel) => {
        if (notification.titleDisplay) return notification.titleDisplay;
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


    const handleNotificationClick = async (notification: NotificationViewModel) => {
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }
        navigate(getNotificationRoute(notification));
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
                    <p className="text-muted-foreground mt-1">Manage all your system alerts and updates.</p>
                </div>
                <Button onClick={markAllAsRead} variant="outline" className="gap-2">
                    <CheckCheck size={16} /> Mark all as read
                </Button>
            </div>

            <Card
                title={
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        <span>Recent Activity</span>
                    </div>
                }
            >
                <div className="h-[calc(100vh-14rem)] overflow-y-auto p-4 max-h-[600px]">
                    {notifications.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">No notifications found.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => handleNotificationClick(notification)}
                                    className={`p-4 border rounded-lg hover:border-primary/50 transition-all cursor-pointer flex gap-4 ${!notification.is_read ? 'bg-primary/5 dark:bg-primary/10 border-primary/20' : 'bg-card'}`}
                                >
                                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notification.is_read ? 'bg-primary' : 'bg-transparent'}`} />

                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-base">{getNotificationTitle(notification)}</p>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                {notification.created_at
                                                    ? timeAgo(notification.created_at)
                                                    : 'just now'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/80 leading-relaxed">{notification.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default NotificationsPage;
