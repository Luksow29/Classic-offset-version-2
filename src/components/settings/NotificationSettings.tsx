// @ts-nocheck
import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { useUser } from '@/context/UserContext';
import { Bell, Mail, MessageSquare, AlertCircle, Clock, ShoppingBag, DollarSign, Phone, Check, Save } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

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
      toast.success('Preferences saved');
    } catch (error: any) {
      console.error('Error saving notification settings:', error);
      toast.error(error.message || 'Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const CompactSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <label className="relative inline-flex items-center cursor-pointer ml-auto">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
    </label>
  );

  const NotificationItem = ({ icon: Icon, title, subtitle, checked, onChange }: any) => (
    <motion.div variants={itemVariants} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
          <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </div>
        <div>
          <p className="text-xs md:text-sm font-medium leading-none">{title}</p>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      <CompactSwitch checked={checked} onChange={onChange} />
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 md:space-y-6 max-w-4xl"
    >
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Notifications</h2>
          <p className="text-xs md:text-base text-muted-foreground mt-0.5">Control how you get notified.</p>
        </div>
        <Button onClick={saveNotificationSettings} size="sm" className="h-8 md:h-10 text-xs md:text-sm shadow-lg shadow-primary/20" disabled={saving}>
          {saving ? <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Save className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />}
          {saving ? '' : 'Save'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {/* Left Column: Channels */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Channels</h3>
          </div>
          <div className="bg-card border border-border rounded-xl p-1 md:p-2 divide-y divide-border/50">
            <NotificationItem
              icon={Mail}
              title="Email"
              subtitle="Get emails for updates."
              checked={localSettings.emailNotifications}
              onChange={() => setLocalSettings(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
            />
            <NotificationItem
              icon={Bell}
              title="Push"
              subtitle="In-app notifications."
              checked={localSettings.pushNotifications}
              onChange={() => setLocalSettings(prev => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
            />
            <NotificationItem
              icon={Phone}
              title="SMS"
              subtitle="Get text messages."
              checked={localSettings.smsNotifications}
              onChange={() => setLocalSettings(prev => ({ ...prev, smsNotifications: !prev.smsNotifications }))}
            />
            <NotificationItem
              icon={MessageSquare}
              title="WhatsApp"
              subtitle="Updates on WhatsApp."
              checked={localSettings.whatsappNotifications}
              onChange={() => setLocalSettings(prev => ({ ...prev, whatsappNotifications: !prev.whatsappNotifications }))}
            />
          </div>
        </div>

        {/* Right Column: Types */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Alert Types</h3>
          </div>
          <div className="bg-card border border-border rounded-xl p-1 md:p-2 divide-y divide-border/50">
            <NotificationItem
              icon={ShoppingBag}
              title="Orders"
              subtitle="Status changes & new orders."
              checked={localSettings.orderUpdates}
              onChange={() => setLocalSettings(prev => ({ ...prev, orderUpdates: !prev.orderUpdates }))}
            />
            <NotificationItem
              icon={DollarSign}
              title="Payments"
              subtitle="Invoices & payments."
              checked={localSettings.paymentAlerts}
              onChange={() => setLocalSettings(prev => ({ ...prev, paymentAlerts: !prev.paymentAlerts }))}
            />
            <NotificationItem
              icon={AlertCircle}
              title="Stock"
              subtitle="Low stock alerts."
              checked={localSettings.stockAlerts}
              onChange={() => setLocalSettings(prev => ({ ...prev, stockAlerts: !prev.stockAlerts }))}
            />
            <NotificationItem
              icon={Bell}
              title="System"
              subtitle="Announcements & updates."
              checked={localSettings.systemAnnouncements}
              onChange={() => setLocalSettings(prev => ({ ...prev, systemAnnouncements: !prev.systemAnnouncements }))}
            />
          </div>
        </div>
      </div>

      {/* Frequency - Bottom Full Width */}
      <motion.div variants={itemVariants} className="pt-2 md:pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Frequency</h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'realtime', label: 'Real-time', desc: 'Instant' },
            { id: 'daily', label: 'Daily', desc: 'Digest' },
            { id: 'weekly', label: 'Weekly', desc: 'Summary' }
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => setLocalSettings({ ...localSettings, notificationFrequency: option.id as any })}
              className={`
                        flex flex-col items-center justify-center p-2 rounded-lg border transition-all
                        ${localSettings.notificationFrequency === option.id
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-card border-border hover:border-primary/50 text-muted-foreground'}
                    `}
            >
              <span className="text-xs font-semibold">{option.label}</span>
              <span className="text-[10px] opacity-70">{option.desc}</span>
              {localSettings.notificationFrequency === option.id && (
                <motion.div layoutId="freq-check" className="mt-1 text-primary">
                  <Check className="w-3 h-3" />
                </motion.div>
              )}
            </button>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
};

export default NotificationSettings;
