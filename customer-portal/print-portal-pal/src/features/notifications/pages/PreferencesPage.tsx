import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase/client';
import { Switch } from '@/shared/components/ui/switch';
import { Button } from '@/shared/components/ui/button';
import { useToast } from '@/shared/hooks/useToast';
import { usePushNotifications } from '@/features/notifications/hooks/usePushNotifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Loader2, Save, RotateCcw, Bell, Mail, Smartphone, MessageSquare, Package, DollarSign, FileText, Truck, AlertCircle, CheckCircle2, LucideIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Tables } from '@/services/supabase/types';

type Customer = Tables<'customers'>;

interface OutletContext {
  user: User | null;
  customer: Customer | null;
}

interface Preference {
  id?: string;
  notification_type: string;
  channels: string[];
  enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

// Notification type configurations with icons and metadata
const NOTIFICATION_TYPE_CONFIG: Record<string, { icon: LucideIcon; label: string; description: string; category: string; color: string }> = {
  order_update: { 
    icon: Package, 
    label: 'Order Updates', 
    description: 'Status changes, confirmations, and updates',
    category: 'Orders & Deliveries',
    color: 'text-blue-600 dark:text-blue-400'
  },
  payment_received: { 
    icon: DollarSign, 
    label: 'Payment Received', 
    description: 'Payment confirmations and receipts',
    category: 'Payments',
    color: 'text-green-600 dark:text-green-400'
  },
  quote_ready: { 
    icon: FileText, 
    label: 'Quote Ready', 
    description: 'New quotes and estimates available',
    category: 'Orders & Deliveries',
    color: 'text-purple-600 dark:text-purple-400'
  },
  delivery_update: { 
    icon: Truck, 
    label: 'Delivery Updates', 
    description: 'Shipping and delivery notifications',
    category: 'Orders & Deliveries',
    color: 'text-orange-600 dark:text-orange-400'
  },
  message: { 
    icon: MessageSquare, 
    label: 'Messages', 
    description: 'Chat and support messages',
    category: 'Messages',
    color: 'text-blue-600 dark:text-blue-400'
  },
  system_alert: { 
    icon: AlertCircle, 
    label: 'System Alerts', 
    description: 'Important system notifications',
    category: 'System',
    color: 'text-red-600 dark:text-red-400'
  },
};

const NOTIFICATION_TYPES = Object.keys(NOTIFICATION_TYPE_CONFIG);

const CHANNEL_CONFIG: Record<string, { icon: LucideIcon; label: string; description: string }> = {
  in_app: { icon: Bell, label: 'In-App', description: 'Notifications within the portal' },
  email: { icon: Mail, label: 'Email', description: 'Send to your email address' },
  push: { icon: Smartphone, label: 'Push', description: 'Browser push notifications' },
  sms: { icon: MessageSquare, label: 'SMS', description: 'Text message alerts' },
};

const CHANNELS = Object.keys(CHANNEL_CONFIG);

export default function NotificationPreferences() {
  const { user } = useOutletContext<OutletContext>();
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState('22:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('08:00');
  const { toast } = useToast();
  
  // Push notification hook
  const {
    permission,
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    loading: pushLoading,
    subscribeToPush,
    unsubscribeFromPush,
  } = usePushNotifications(user?.id);

  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && data.length > 0) {
        const userPreferences = new Map(data.map(p => [p.notification_type, p]));
        const allPreferences = NOTIFICATION_TYPES.map(type => {
          return userPreferences.get(type) || {
            notification_type: type,
            channels: ['in_app'],
            enabled: true,
          };
        });
        setPreferences(allPreferences);
        
        // Load quiet hours from first preference (they're the same for all)
        const firstPref = data[0];
        if (firstPref.quiet_hours_start && firstPref.quiet_hours_end) {
          setQuietHoursEnabled(true);
          setQuietHoursStart(firstPref.quiet_hours_start);
          setQuietHoursEnd(firstPref.quiet_hours_end);
        }
      } else {
        // Initialize with defaults
        const defaultPreferences = NOTIFICATION_TYPES.map(type => ({
          notification_type: type,
          channels: ['in_app'],
          enabled: true,
        }));
        setPreferences(defaultPreferences);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "❌ Failed to Load",
        description: "Could not load your notification preferences. Please refresh the page.",
        variant: "destructive",
      });
      
      // Still set defaults so UI isn't empty
      const defaultPreferences = NOTIFICATION_TYPES.map(type => ({
        notification_type: type,
        channels: ['in_app'],
        enabled: true,
      }));
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  function handleToggle(type: string, enabled: boolean) {
    setPreferences((prev) =>
      prev.map((p) =>
        p.notification_type === type ? { ...p, enabled } : p
      )
    );
    setHasChanges(true);
  }

  async function handleChannelChange(type: string, channel: string, checked: boolean) {
    // Special handling for push channel
    if (channel === 'push') {
      if (checked && !pushSubscribed) {
        // Need to subscribe to push first
        const success = await subscribeToPush();
        if (!success) {
          toast({
            title: "Push Subscription Failed",
            description: "Please enable push notifications in your browser settings first.",
            variant: "destructive",
          });
          return;
        }
      } else if (!checked && pushSubscribed) {
        // Ask for confirmation before unsubscribing
        const confirmUnsub = confirm("Are you sure you want to disable push notifications for all notification types?");
        if (confirmUnsub) {
          await unsubscribeFromPush();
        } else {
          return; // User cancelled
        }
      }
    }

    setPreferences((prev) =>
      prev.map((p) =>
        p.notification_type === type
          ? {
              ...p,
              channels: checked
                ? Array.from(new Set([...(p.channels || []), channel]))
                : (p.channels || []).filter((c) => c !== channel),
            }
          : p
      )
    );
    setHasChanges(true);
  }

  async function savePreferences() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Use Promise.all for batch operations
      const results = await Promise.all(
        preferences.map(async (pref) => {
          // First, try to find existing preference
          const { data: existing } = await supabase
            .from('notification_preferences')
            .select('id')
            .eq('user_id', user.id)
            .eq('notification_type', pref.notification_type)
            .eq('user_type', 'customer')
            .single();

          const prefData = {
            user_id: user.id,
            user_type: 'customer',
            notification_type: pref.notification_type,
            channels: pref.channels,
            enabled: pref.enabled,
            quiet_hours_start: quietHoursEnabled ? quietHoursStart : null,
            quiet_hours_end: quietHoursEnabled ? quietHoursEnd : null,
            updated_at: new Date().toISOString(),
          };

          if (existing) {
            // Update existing
            return supabase
              .from('notification_preferences')
              .update(prefData)
              .eq('id', existing.id);
          } else {
            // Insert new
            return supabase
              .from('notification_preferences')
              .insert(prefData);
          }
        })
      );

      // Check for any errors
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        console.error('Save errors:', errors);
        throw new Error(`Failed to save ${errors.length} preference(s)`);
      }

      // Success!
      toast({
        title: "✅ Preferences Saved",
        description: "Your notification settings have been updated successfully.",
      });

      setHasChanges(false);

      // Refresh to confirm persistence
      await fetchPreferences();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "❌ Save Failed",
        description: error instanceof Error ? error.message : "Could not save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    const defaultPreferences = NOTIFICATION_TYPES.map(type => ({
      notification_type: type,
      channels: ['in_app'],
      enabled: true,
    }));
    setPreferences(defaultPreferences);
    setHasChanges(true);
    toast({
      title: "Reset to Defaults",
      description: "Preferences reset. Click Save to apply changes.",
    });
  }

  // Group preferences by category
  const groupedPreferences = preferences.reduce((acc, pref) => {
    const config = NOTIFICATION_TYPE_CONFIG[pref.notification_type];
    if (config) {
      const category = config.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(pref);
    }
    return acc;
  }, {} as Record<string, Preference[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your notification preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Notification Preferences</h1>
        <p className="text-muted-foreground">
          Manage how you receive notifications across different channels
        </p>
      </div>

      {/* Save Status Alert */}
      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Click <strong>Save Preferences</strong> to apply them.
          </AlertDescription>
        </Alert>
      )}

      {/* Push Notification Status Alert */}
      {!pushSupported && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Push notifications are not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.
          </AlertDescription>
        </Alert>
      )}
      
      {pushSupported && permission === 'denied' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Push notifications are blocked. Please enable them in your browser settings to use this feature.
          </AlertDescription>
        </Alert>
      )}

      {/* Channels Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CHANNELS.map((channel) => {
              const config = CHANNEL_CONFIG[channel];
              const Icon = config.icon;
              const isEnabled = preferences.some(p => p.enabled && p.channels.includes(channel));
              
              // Special handling for push channel
              const isPushChannel = channel === 'push';
              const pushStatus = isPushChannel ? (
                pushSubscribed ? 'Subscribed' : 
                permission === 'denied' ? 'Blocked' :
                permission === 'granted' ? 'Not Subscribed' :
                'Not Enabled'
              ) : null;
              
              return (
                <div
                  key={channel}
                  className={`p-4 border rounded-lg transition-colors ${
                    isEnabled ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-5 w-5 ${isEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {isEnabled && (
                      <Badge variant="secondary" className="text-xs">
                        Active
                      </Badge>
                    )}
                    {isPushChannel && pushStatus && (
                      <Badge 
                        variant={pushSubscribed ? 'default' : permission === 'denied' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {pushStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Grouped Notification Preferences */}
      <div className="space-y-4">
        {Object.entries(groupedPreferences).map(([category, categoryPrefs]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category}</CardTitle>
              <CardDescription>
                {categoryPrefs.length} notification type{categoryPrefs.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categoryPrefs.map((pref) => {
                const config = NOTIFICATION_TYPE_CONFIG[pref.notification_type];
                if (!config) return null;
                
                const Icon = config.icon;
                
                return (
                  <div key={pref.notification_type} className="space-y-4">
                    {/* Notification Type Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg bg-muted`}>
                          <Icon className={`h-5 w-5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{config.label}</h4>
                            {pref.enabled && (
                              <Badge variant="secondary" className="text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Enabled
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={pref.enabled}
                        onCheckedChange={(checked) => handleToggle(pref.notification_type, checked)}
                        aria-label={`Toggle ${config.label}`}
                      />
                    </div>

                    {/* Channel Checkboxes */}
                    {pref.enabled && (
                      <div className="ml-14 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Notify me via:
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {CHANNELS.map((channel) => {
                            const channelConfig = CHANNEL_CONFIG[channel];
                            const ChannelIcon = channelConfig.icon;
                            const isChecked = pref.channels.includes(channel);
                            
                            return (
                              <label
                                key={channel}
                                className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors hover:bg-muted ${
                                  isChecked ? 'border-primary bg-primary/5' : 'border-border'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) =>
                                    handleChannelChange(pref.notification_type, channel, e.target.checked)
                                  }
                                  className="rounded border-gray-300"
                                />
                                <ChannelIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{channelConfig.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {categoryPrefs.indexOf(pref) < categoryPrefs.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quiet Hours Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Quiet Hours</CardTitle>
              <CardDescription>
                Silence notifications during specific hours (In-app notifications only)
              </CardDescription>
            </div>
            <Switch
              checked={quietHoursEnabled}
              onCheckedChange={(checked) => {
                setQuietHoursEnabled(checked);
                setHasChanges(true);
              }}
            />
          </div>
        </CardHeader>
        {quietHoursEnabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Time</label>
                <input
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => {
                    setQuietHoursStart(e.target.value);
                    setHasChanges(true);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Notifications will be silenced from this time
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">End Time</label>
                <input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => {
                    setQuietHoursEnd(e.target.value);
                    setHasChanges(true);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground">
                  Notifications will resume after this time
                </p>
              </div>
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                During quiet hours ({quietHoursStart} - {quietHoursEnd}), in-app notification popups will be suppressed. 
                You'll still receive notifications but without sound or popup alerts.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Button
              variant="outline"
              onClick={resetToDefaults}
              disabled={saving}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={fetchPreferences}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              
              <Button
                onClick={savePreferences}
                disabled={saving || !hasChanges}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {!hasChanges && !saving && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              All changes are saved
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
