// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { useUser } from '@/context/UserContext';
import { Bell, Mail, MessageSquare, AlertCircle, Clock, ShoppingBag, DollarSign, Phone } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { Loader2 } from 'lucide-react';
import Button from '../ui/Button';

const NotificationSettings: React.FC = () => {
  const { user } = useUser();
  const { settings, updateSettings, loading } = useSettings();
  const [saving, setSaving] = useState(false);

  // Local state for notification preferences
  const [localSettings, setLocalSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    whatsappNotifications: false,
    orderUpdates: true,
    paymentAlerts: true,
    stockAlerts: true,
    systemAnnouncements: true,
    notificationFrequency: 'realtime' as 'realtime' | 'daily' | 'weekly',
  });

  // Sync local state with settings from Supabase
  useEffect(() => {
    if (settings?.notification_preferences) {
      setLocalSettings({
        emailNotifications: settings.notification_preferences.email ?? true,
        pushNotifications: settings.notification_preferences.push ?? true,
        smsNotifications: settings.notification_preferences.sms ?? false,
        whatsappNotifications: settings.notification_preferences.whatsapp ?? false,
        orderUpdates: settings.notification_preferences.types?.orders ?? true,
        paymentAlerts: settings.notification_preferences.types?.payments ?? true,
        stockAlerts: settings.notification_preferences.types?.stock ?? true,
        systemAnnouncements: settings.notification_preferences.types?.system ?? true,
        notificationFrequency: settings.notification_preferences.frequency ?? 'realtime',
      });
    }
  }, [settings]);

  const saveNotificationSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await updateSettings({
        notification_preferences: {
          email: localSettings.emailNotifications,
          push: localSettings.pushNotifications,
          sms: localSettings.smsNotifications,
          whatsapp: localSettings.whatsappNotifications,
          frequency: localSettings.notificationFrequency,
          types: {
            orders: localSettings.orderUpdates,
            payments: localSettings.paymentAlerts,
            stock: localSettings.stockAlerts,
            system: localSettings.systemAnnouncements,
          }
        }
      });
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast.error(error.message || 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-8">
        {/* Notification Channels */}
        <div>
          <h3 className="text-lg font-medium mb-4">Notification Channels</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={localSettings.emailNotifications}
                  onChange={() => setLocalSettings({ ...localSettings, emailNotifications: !localSettings.emailNotifications })}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications in the app</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={localSettings.pushNotifications}
                  onChange={() => setLocalSettings({ ...localSettings, pushNotifications: !localSettings.pushNotifications })}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={localSettings.smsNotifications}
                  onChange={() => setLocalSettings({ ...localSettings, smsNotifications: !localSettings.smsNotifications })}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">WhatsApp Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via WhatsApp</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={localSettings.whatsappNotifications}
                  onChange={() => setLocalSettings({ ...localSettings, whatsappNotifications: !localSettings.whatsappNotifications })}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 className="text-lg font-medium mb-4">Notification Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Order Updates</p>
                  <p className="text-sm text-muted-foreground">Notifications about order status changes</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={localSettings.orderUpdates}
                  onChange={() => setLocalSettings({ ...localSettings, orderUpdates: !localSettings.orderUpdates })}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Payment Alerts</p>
                  <p className="text-sm text-muted-foreground">Notifications about payments and invoices</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={localSettings.paymentAlerts}
                  onChange={() => setLocalSettings({ ...localSettings, paymentAlerts: !localSettings.paymentAlerts })}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Notifications about low stock and inventory</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={localSettings.stockAlerts}
                  onChange={() => setLocalSettings({ ...localSettings, stockAlerts: !localSettings.stockAlerts })}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">System Announcements</p>
                  <p className="text-sm text-muted-foreground">Important system updates and announcements</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={localSettings.systemAnnouncements}
                  onChange={() => setLocalSettings({ ...localSettings, systemAnnouncements: !localSettings.systemAnnouncements })}
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Frequency */}
        <div>
          <h3 className="text-lg font-medium mb-4">Notification Frequency</h3>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Delivery Frequency</p>
              <p className="text-sm text-muted-foreground">How often you want to receive notifications</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all ${localSettings.notificationFrequency === 'realtime' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onClick={() => setLocalSettings({ ...localSettings, notificationFrequency: 'realtime' })}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Real-time</h4>
                <div className={`w-4 h-4 rounded-full ${localSettings.notificationFrequency === 'realtime' ? 'bg-primary' : 'border border-muted-foreground'}`}></div>
              </div>
              <p className="text-sm text-muted-foreground">Receive notifications as events happen</p>
            </div>

            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all ${localSettings.notificationFrequency === 'daily' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onClick={() => setLocalSettings({ ...localSettings, notificationFrequency: 'daily' })}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Daily Digest</h4>
                <div className={`w-4 h-4 rounded-full ${localSettings.notificationFrequency === 'daily' ? 'bg-primary' : 'border border-muted-foreground'}`}></div>
              </div>
              <p className="text-sm text-muted-foreground">Receive a daily summary of all notifications</p>
            </div>

            <div
              className={`p-4 border rounded-lg cursor-pointer transition-all ${localSettings.notificationFrequency === 'weekly' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
              onClick={() => setLocalSettings({ ...localSettings, notificationFrequency: 'weekly' })}
            >
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Weekly Digest</h4>
                <div className={`w-4 h-4 rounded-full ${localSettings.notificationFrequency === 'weekly' ? 'bg-primary' : 'border border-muted-foreground'}`}></div>
              </div>
              <p className="text-sm text-muted-foreground">Receive a weekly summary of all notifications</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveNotificationSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default NotificationSettings;
