import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, BellOff, TestTube, Settings, Check, X, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface OutletContext {
  user: any;
  customer: any;
}

export const NotificationSettings: React.FC = () => {
  const { user } = useOutletContext<OutletContext>();
  const {
    permission,
    isSupported,
    isSubscribed,
    loading,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
    getSubscriptionInfo
  } = usePushNotifications(user?.id);

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><Check className="w-3 h-3 mr-1" />Granted</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"><X className="w-3 h-3 mr-1" />Denied</Badge>;
      case 'default':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><AlertCircle className="w-3 h-3 mr-1" />Not Asked</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusColor = () => {
    if (!isSupported) return 'text-red-500';
    if (isSubscribed) return 'text-green-500';
    if (permission === 'denied') return 'text-red-500';
    return 'text-yellow-500';
  };

  const getStatusText = () => {
    if (!isSupported) return 'Not Supported';
    if (isSubscribed) return 'Active';
    if (permission === 'denied') return 'Blocked';
    return 'Inactive';
  };

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribeFromPush();
    } else {
      await subscribeToPush();
    }
  };

  const handleTestNotification = () => {
    sendTestNotification();
  };

  const subscriptionInfo = getSubscriptionInfo();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Push Notifications</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            <div className={`w-3 h-3 rounded-full ${
              isSubscribed ? 'bg-green-500' : 
              permission === 'denied' ? 'bg-red-500' : 
              'bg-yellow-500'
            }`} />
          </div>
        </div>
        <CardDescription>
          Get instant notifications for order updates, messages, and important alerts
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Support Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Browser Support</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span>Push Notifications:</span>
              <Badge variant={isSupported ? 'default' : 'destructive'}>
                {isSupported ? 'Supported' : 'Not Supported'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Permission Status:</span>
              {getPermissionBadge()}
            </div>
          </div>
        </div>

        <Separator />

        {/* Subscription Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Subscription Status</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Push Notifications:</span>
              <Badge variant={isSubscribed ? 'default' : 'secondary'}>
                {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
              </Badge>
            </div>
            {subscriptionInfo && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Subscribed: {new Date(subscriptionInfo.timestamp).toLocaleString()}</div>
                <div>User ID: {subscriptionInfo.userId}</div>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Controls */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Controls</h4>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleToggleNotifications}
              disabled={!isSupported || loading}
              className="flex-1"
              variant={isSubscribed ? 'destructive' : 'default'}
            >
              {loading ? (
                <>
                  <Settings className="w-4 h-4 mr-2 animate-spin" />
                  {isSubscribed ? 'Disabling...' : 'Enabling...'}
                </>
              ) : isSubscribed ? (
                <>
                  <BellOff className="w-4 h-4 mr-2" />
                  Disable Notifications
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Notifications
                </>
              )}
            </Button>

            {isSubscribed && (
              <Button
                onClick={handleTestNotification}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Send Test
              </Button>
            )}
          </div>

          {!isSupported && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Push Notifications Not Available
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    Your browser doesn't support push notifications or service workers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {permission === 'denied' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <X className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Notifications Blocked
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    Please enable notifications in your browser settings to receive updates.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">What You'll Receive</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Order status updates</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Payment confirmations</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span>New chat messages</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span>Delivery notifications</span>
            </div>
          </div>
        </div>

        {/* Debug Info (only in development) */}
        {process.env.NODE_ENV === 'development' && subscriptionInfo && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Debug Info</summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {JSON.stringify(subscriptionInfo, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
};
