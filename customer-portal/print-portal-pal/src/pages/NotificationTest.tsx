import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Send, 
  TestTube, 
  Settings, 
  Activity, 
  Server, 
  Smartphone,
  Check,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useToast } from '@/hooks/use-toast';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';

export default function NotificationTest() {
  const { toast } = useToast();
  const [customMessage, setCustomMessage] = useState({
    title: 'Test Notification',
    body: 'This is a test message from the customer portal',
    icon: '/icon-192x192.svg',
    badge: '/icon-192x192.svg',
    tag: 'test-notification',
    url: '/'
  });
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [sendingCustom, setSendingCustom] = useState(false);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  const {
    permission,
    isSupported,
    isSubscribed,
    loading,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
    getSubscriptionInfo
  } = usePushNotifications('test-user-123');

  // Check server status
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:3002/health');
        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (error) {
        setServerStatus('offline');
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Load subscriptions
  const loadSubscriptions = async () => {
    if (serverStatus !== 'online') return;
    
    setLoadingSubscriptions(true);
    try {
      const response = await fetch('http://localhost:3002/api/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  useEffect(() => {
    if (serverStatus === 'online') {
      loadSubscriptions();
    }
  }, [serverStatus]);

  const sendCustomNotification = async () => {
    if (serverStatus !== 'online') {
      toast({
        title: "Server Offline",
        description: "Push notification server is not running",
        variant: "destructive"
      });
      return;
    }

    setSendingCustom(true);
    try {
      const response = await fetch('http://localhost:3002/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'test-user-123',
          notification: customMessage
        })
      });

      if (response.ok) {
        toast({
          title: "Notification Sent",
          description: "Custom notification has been sent successfully"
        });
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send custom notification",
        variant: "destructive"
      });
    } finally {
      setSendingCustom(false);
    }
  };

  const sendToAllSubscriptions = async () => {
    if (serverStatus !== 'online' || subscriptions.length === 0) return;

    try {
      const response = await fetch('http://localhost:3002/api/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notification: {
            title: 'Broadcast Message',
            body: 'This message was sent to all subscribed users',
            icon: '/icon-192x192.svg'
          }
        })
      });

      if (response.ok) {
        toast({
          title: "Broadcast Sent",
          description: `Notification sent to ${subscriptions.length} subscribers`
        });
      }
    } catch (error) {
      toast({
        title: "Broadcast Failed",
        description: "Failed to send broadcast notification",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <Check className="w-4 h-4" />;
      case 'offline': return <X className="w-4 h-4" />;
      default: return <Loader2 className="w-4 h-4 animate-spin" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Push Notification Test Center</h1>
          <p className="text-muted-foreground mt-2">
            Test and monitor push notification functionality
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 ${getStatusColor(serverStatus)}`}>
            {getStatusIcon(serverStatus)}
            <span className="text-sm font-medium">
              Server {serverStatus === 'checking' ? 'Checking...' : serverStatus}
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="debug">Debug</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Quick Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TestTube className="w-5 h-5" />
                  <span>Quick Tests</span>
                </CardTitle>
                <CardDescription>
                  Test basic notification functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={sendTestNotification}
                  disabled={!isSubscribed || loading}
                  className="w-full"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Send Test Notification
                </Button>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-medium">System Status</Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Browser Support:</span>
                      <Badge variant={isSupported ? 'default' : 'destructive'}>
                        {isSupported ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Permission:</span>
                      <Badge variant={permission === 'granted' ? 'default' : 'secondary'}>
                        {permission}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Subscribed:</span>
                      <Badge variant={isSubscribed ? 'default' : 'secondary'}>
                        {isSubscribed ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Server:</span>
                      <Badge variant={serverStatus === 'online' ? 'default' : 'destructive'}>
                        {serverStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Custom Notification */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>Custom Notification</span>
                </CardTitle>
                <CardDescription>
                  Send a custom notification with your own content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={customMessage.title}
                    onChange={(e) => setCustomMessage({...customMessage, title: e.target.value})}
                    placeholder="Notification title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Message</Label>
                  <Textarea
                    id="body"
                    value={customMessage.body}
                    onChange={(e) => setCustomMessage({...customMessage, body: e.target.value})}
                    placeholder="Notification message"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="tag">Tag</Label>
                    <Input
                      id="tag"
                      value={customMessage.tag}
                      onChange={(e) => setCustomMessage({...customMessage, tag: e.target.value})}
                      placeholder="notification-tag"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Click URL</Label>
                    <Input
                      id="url"
                      value={customMessage.url}
                      onChange={(e) => setCustomMessage({...customMessage, url: e.target.value})}
                      placeholder="/dashboard"
                    />
                  </div>
                </div>

                <Button
                  onClick={sendCustomNotification}
                  disabled={!isSubscribed || serverStatus !== 'online' || sendingCustom}
                  className="w-full"
                >
                  {sendingCustom ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Send Custom Notification
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid gap-6">
            {/* Server Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Server className="w-5 h-5" />
                    <CardTitle>Server Status</CardTitle>
                  </div>
                  <Button
                    onClick={loadSubscriptions}
                    disabled={serverStatus !== 'online' || loadingSubscriptions}
                    variant="outline"
                    size="sm"
                  >
                    {loadingSubscriptions ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                    Refresh
                  </Button>
                </div>
                <CardDescription>
                  Push notification server monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Server Status:</span>
                    <div className={`flex items-center space-x-2 ${getStatusColor(serverStatus)}`}>
                      {getStatusIcon(serverStatus)}
                      <span className="font-medium capitalize">{serverStatus}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Active Subscriptions:</span>
                    <Badge variant="outline">
                      {subscriptions.length}
                    </Badge>
                  </div>

                  {subscriptions.length > 0 && (
                    <Button
                      onClick={sendToAllSubscriptions}
                      disabled={serverStatus !== 'online'}
                      variant="outline"
                      className="w-full"
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Send to All Subscribers
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subscriptions List */}
            {subscriptions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Active Subscriptions</CardTitle>
                  <CardDescription>
                    Currently registered push notification subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {subscriptions.map((sub, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">User: {sub.userId}</div>
                            <div className="text-sm text-muted-foreground">
                              Subscribed: {new Date(sub.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Debug Information</span>
              </CardTitle>
              <CardDescription>
                Technical details and subscription information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Subscription Info */}
                {getSubscriptionInfo() && (
                  <div>
                    <h4 className="font-medium mb-2">Subscription Details</h4>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                      {JSON.stringify(getSubscriptionInfo(), null, 2)}
                    </pre>
                  </div>
                )}

                {/* Service Worker Status */}
                <div>
                  <h4 className="font-medium mb-2">Service Worker</h4>
                  <div className="text-sm space-y-1">
                    <div>Supported: {('serviceWorker' in navigator) ? 'Yes' : 'No'}</div>
                    <div>Push Supported: {('PushManager' in window) ? 'Yes' : 'No'}</div>
                    <div>Notification Supported: {('Notification' in window) ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                {/* Environment */}
                <div>
                  <h4 className="font-medium mb-2">Environment</h4>
                  <div className="text-sm space-y-1">
                    <div>HTTPS: {location.protocol === 'https:' ? 'Yes' : 'No'}</div>
                    <div>Localhost: {location.hostname === 'localhost' ? 'Yes' : 'No'}</div>
                    <div>User Agent: {navigator.userAgent.slice(0, 50)}...</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
