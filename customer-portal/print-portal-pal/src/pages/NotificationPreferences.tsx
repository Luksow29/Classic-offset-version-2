import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface Preference {
  id?: string;
  notification_type: string;
  channels: string[];
  enabled: boolean;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}

const NOTIFICATION_TYPES = [
  'order_update',
  'payment_received',
  'quote_ready',
  'delivery_update',
  'message',
  'system_alert',
];

const CHANNELS = ['in_app', 'email', 'push', 'sms'];

export default function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    setLoading(true);
    // Replace with actual user id fetch
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return;
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId);
    if (!error && data) setPreferences(data);
    setLoading(false);
  }

  function handleToggle(type: string, enabled: boolean) {
    setPreferences((prev) =>
      prev.map((p) =>
        p.notification_type === type ? { ...p, enabled } : p
      )
    );
  }

  function handleChannelChange(type: string, channel: string, checked: boolean) {
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
  }

  async function savePreferences() {
    setSaving(true);
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    if (!userId) return;
    for (const pref of preferences) {
      await supabase.from('notification_preferences').upsert({
        ...pref,
        user_id: userId,
        user_type: 'customer',
      }, { onConflict: 'user_id,notification_type' });
    }
    setSaving(false);
    fetchPreferences();
  }

  if (loading) return <div>Loading preferences...</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Notification Preferences</h2>
      <div className="space-y-6">
        {NOTIFICATION_TYPES.map((type) => {
          const pref = preferences.find((p) => p.notification_type === type) || {
            notification_type: type,
            channels: ['in_app'],
            enabled: true,
          };
          return (
            <div key={type} className="border rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                <Switch
                  checked={pref.enabled}
                  onCheckedChange={(checked) => handleToggle(type, checked)}
                />
              </div>
              <div className="flex gap-4 flex-wrap">
                {CHANNELS.map((channel) => (
                  <label key={channel} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={pref.channels.includes(channel)}
                      onChange={(e) => handleChannelChange(type, channel, e.target.checked)}
                    />
                    <span className="capitalize">{channel.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <Button className="mt-6" onClick={savePreferences} disabled={saving}>
        {saving ? 'Saving...' : 'Save Preferences'}
      </Button>
    </div>
  );
}
