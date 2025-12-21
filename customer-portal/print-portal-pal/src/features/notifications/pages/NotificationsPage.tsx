import React from 'react';
import { Check, Clock, ExternalLink, Bell } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { useNotifications, type Notification as NotificationData } from '@/features/notifications/hooks/useNotifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';

const NotificationsPage: React.FC = () => {
    const {
        notifications,
        loading,
        markAsRead,
        markAllAsRead
    } = useNotifications();

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'order_update': return '📝';
            case 'payment_received': return '💰';
            case 'delivery_update': return '🚚';
            case 'message': return '💬';
            case 'quote_ready': return '📄';
            case 'system_alert': return '⚠️';
            default: return '🔔';
        }
    };

    const getNotificationColor = (type: string, is_read: boolean) => {
        if (is_read) return 'text-muted-foreground';

        switch (type) {
            case 'system_alert': return 'text-red-600 dark:text-red-400';
            case 'payment_received': return 'text-green-600 dark:text-green-400';
            case 'order_update': return 'text-blue-600 dark:text-blue-400';
            case 'delivery_update': return 'text-teal-600 dark:text-teal-400';
            case 'message': return 'text-indigo-600 dark:text-indigo-400';
            case 'quote_ready': return 'text-amber-700 dark:text-amber-300';
            default: return 'text-gray-600 dark:text-gray-400';
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-IN');
    };

    const handleNotificationClick = (notification: NotificationData) => {
        if (!notification.is_read) {
            markAsRead(notification.id);
        }

        if (notification.link_to) {
            window.location.href = notification.link_to;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Stay updated with your orders, payments, and messages.
                    </p>
                </div>
                <Button onClick={markAllAsRead} variant="outline" className="gap-2">
                    <Check className="h-4 w-4" />
                    Mark all as read
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell size={20} />
                        All Notifications
                    </CardTitle>
                    <CardDescription>A complete history of your alerts and updates.</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                            Loading notifications...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No notifications yet</p>
                            <p className="text-sm mt-2">You're all caught up! updates will appear here.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[calc(100vh-14rem)] pr-4">
                            <div className="divide-y dark:divide-gray-700 border rounded-md">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${!notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                                            }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className="flex-shrink-0 mt-1">
                                                <span className="text-2xl select-none">
                                                    {getNotificationIcon(notification.type)}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    <h4 className={`font-semibold text-base truncate ${getNotificationColor(notification.type, notification.is_read)}`}>
                                                        {notification.title}
                                                    </h4>
                                                    {!notification.is_read && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                                            New
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">
                                                    {notification.message}
                                                </p>

                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span>{formatTime(notification.created_at)}</span>
                                                    </div>

                                                    {notification.link_to && (
                                                        <div className="flex items-center gap-1 text-primary hover:underline">
                                                            <span>View Details</span>
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default NotificationsPage;
