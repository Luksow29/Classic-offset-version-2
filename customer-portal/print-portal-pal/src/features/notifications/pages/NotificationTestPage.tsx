import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase/client';
import { useToast } from '@/shared/hooks/useToast';
import { usePushNotifications } from '@/features/notifications/hooks/usePushNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Separator } from '@/shared/components/ui/separator';
import {
  TestTube,
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Package,
  DollarSign,
  FileText,
  Truck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Code,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import { Tables } from '@/services/supabase/types';

type Customer = Tables<'customers'>;

interface OutletContext {
  user: User | null;
  customer: Customer | null;
}

interface TestResult {
  channel: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  timestamp: Date;
}

const NOTIFICATION_TESTS = [
  {
    type: 'order_update',
    icon: Package,
    label: 'Order Update',
    title: 'Your Order is Being Processed',
    message: 'Order #12345 is now being prepared for production.',
    color: 'text-blue-600',
  },
  {
    type: 'payment_received',
    icon: DollarSign,
    label: 'Payment Received',
    title: 'Payment Confirmed',
    message: 'We have received your payment of ₹5,000. Thank you!',
    color: 'text-green-600',
  },
  {
    type: 'quote_ready',
    icon: FileText,
    label: 'Quote Ready',
    title: 'Your Quote is Ready',
    message: 'A new quote for your printing request is now available.',
    color: 'text-purple-600',
  },
  {
    type: 'delivery_update',
    icon: Truck,
    label: 'Delivery Update',
    title: 'Out for Delivery',
    message: 'Your order is on its way and will arrive today.',
    color: 'text-orange-600',
  },
  {
    type: 'message',
    icon: MessageSquare,
    label: 'New Message',
    title: 'New Message from Support',
    message: 'You have a new message regarding your order inquiry.',
    color: 'text-blue-600',
  },
  {
    type: 'system_alert',
    icon: AlertCircle,
    label: 'System Alert',
    title: 'System Maintenance Scheduled',
    message: 'Our system will undergo maintenance on Sunday, 2:00 AM - 4:00 AM.',
    color: 'text-red-600',
  },
];

export default function NotificationTestPage() {
  const { user, customer } = useOutletContext<OutletContext>();
  const { toast } = useToast();
  const {
    permission,
    isSupported,
    isSubscribed,
    subscribeToPush,
    sendTestNotification: sendPushTest,
  } = usePushNotifications(user?.id);

  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const addTestResult = (channel: string, status: 'success' | 'error', message: string) => {
    setTestResults((prev) => [
      {
        channel,
        status,
        message,
        timestamp: new Date(),
      },
      ...prev.slice(0, 19), // Keep last 20 results
    ]);
  };

  const testInAppNotification = async (notifType: typeof NOTIFICATION_TESTS[0]) => {
    try {
      if (!user || !customer) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase.from('notifications').insert({
        user_id: user.id,
        type: notifType.type,
        title: notifType.title,
        message: notifType.message,
        is_read: false,
        link_to: '/customer-portal/notifications',
      });

      if (error) throw error;

      addTestResult('In-App', 'success', `${notifType.label} notification created`);
      
      toast({
        title: `✅ ${notifType.label}`,
        description: 'In-app notification sent successfully!',
      });

      return true;
    } catch (error) {
      console.error('In-app test error:', error);
      addTestResult('In-App', 'error', error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: '❌ Test Failed',
        description: 'Could not send in-app notification',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  const testBrowserNotification = async (notifType: typeof NOTIFICATION_TESTS[0]) => {
    try {
      if (!('Notification' in window)) {
        throw new Error('Browser does not support notifications');
      }

      if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission();
        if (result !== 'granted') {
          throw new Error('Notification permission denied');
        }
      }

      const notification = new Notification(notifType.title, {
        body: notifType.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: `test-${notifType.type}`,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      setTimeout(() => notification.close(), 5000);

      addTestResult('Browser', 'success', `${notifType.label} browser notification shown`);
      
      toast({
        title: '✅ Browser Notification',
        description: 'Check your browser for the notification!',
      });

      return true;
    } catch (error) {
      console.error('Browser notification test error:', error);
      addTestResult('Browser', 'error', error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: '❌ Browser Test Failed',
        description: error instanceof Error ? error.message : 'Could not show browser notification',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  const testPushNotification = async (notifType: typeof NOTIFICATION_TESTS[0]) => {
    try {
      if (!isSubscribed) {
        throw new Error('Not subscribed to push notifications');
      }

      await sendPushTest();

      addTestResult('Push', 'success', `${notifType.label} push notification sent`);
      
      return true;
    } catch (error) {
      console.error('Push notification test error:', error);
      addTestResult('Push', 'error', error instanceof Error ? error.message : 'Unknown error');
      
      toast({
        title: '❌ Push Test Failed',
        description: 'Could not send push notification',
        variant: 'destructive',
      });
      
      return false;
    }
  };

  const testAllChannels = async (notifType: typeof NOTIFICATION_TESTS[0]) => {
    setTesting(true);
    setSelectedTest(notifType.type);

    const results = await Promise.allSettled([
      testInAppNotification(notifType),
      testBrowserNotification(notifType),
      isSubscribed ? testPushNotification(notifType) : Promise.resolve(false),
    ]);

    console.log('Test results:', results);

    setTesting(false);
    setSelectedTest(null);
  };

  const clearResults = () => {
    setTestResults([]);
    toast({
      title: 'Results Cleared',
      description: 'Test history has been cleared',
    });
  };

  const getDebugInfo = () => {
    return {
      user: {
        id: user?.id,
        email: user?.email,
      },
      customer: {
        id: customer?.id,
        name: customer?.name,
      },
      browser: {
        notificationSupport: 'Notification' in window,
        permission: 'Notification' in window ? Notification.permission : 'N/A',
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
      },
      push: {
        isSupported,
        isSubscribed,
        permission,
      },
      timestamp: new Date().toISOString(),
    };
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TestTube className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notification Test Center</h1>
        </div>
        <p className="text-muted-foreground">
          Test different notification types across all channels
        </p>
      </div>

      {/* Push Notification Status */}
      <Alert className={isSubscribed ? 'border-green-500' : 'border-yellow-500'}>
        <Smartphone className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>Push Notifications:</strong>{' '}
            {isSubscribed ? 'Enabled and ready for testing' : 'Not enabled'}
          </div>
          {!isSubscribed && (
            <Button size="sm" onClick={subscribeToPush}>
              Enable Push
            </Button>
          )}
        </AlertDescription>
      </Alert>

      {/* Test Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {NOTIFICATION_TESTS.map((test) => {
          const Icon = test.icon;
          const isTesting = testing && selectedTest === test.type;

          return (
            <Card key={test.type} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className={`h-6 w-6 ${test.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{test.label}</CardTitle>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {test.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{test.title}</p>
                  <p className="text-xs text-muted-foreground">{test.message}</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button
                    onClick={() => testAllChannels(test)}
                    disabled={testing}
                    className="w-full"
                    size="sm"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Test All Channels
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-3 gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testInAppNotification(test)}
                      disabled={testing}
                      className="text-xs px-2"
                    >
                      <Bell className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testBrowserNotification(test)}
                      disabled={testing}
                      className="text-xs px-2"
                    >
                      <Smartphone className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testPushNotification(test)}
                      disabled={testing || !isSubscribed}
                      className="text-xs px-2"
                    >
                      <Mail className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Recent test execution history</CardDescription>
            </div>
            {testResults.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearResults}>
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TestTube className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No tests run yet. Try testing a notification above!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{result.channel}</p>
                      <p className="text-xs text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Collapsible open={showDebug} onOpenChange={setShowDebug}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  <CardTitle>Debug Information</CardTitle>
                </div>
                {showDebug ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(getDebugInfo(), null, 2)}
              </pre>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
