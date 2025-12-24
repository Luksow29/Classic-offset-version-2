import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Globe, Loader2, Languages, Clock, Calendar, Coins } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import toast from 'react-hot-toast';

const LocalizationSettings: React.FC = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [saving, setSaving] = useState(false);

  const [localSettings, setLocalSettings] = useState({
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  });

  // Sync local state with settings from Supabase
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        language: settings.language_preference || 'en',
        dateFormat: settings.date_format || 'DD/MM/YYYY',
        timeFormat: settings.time_format || '24h',
        currency: settings.currency || 'INR',
        timezone: settings.timezone || 'Asia/Kolkata',
      });
    }
  }, [settings]);

  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  ];

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: '31/12/2025' },
    { value: 'MM/DD/YYYY', label: '12/31/2025' },
    { value: 'YYYY-MM-DD', label: '2025-12-31' },
    { value: 'DD-MMM-YYYY', label: '31-Dec-2025' }
  ];

  const timeFormats = [
    { value: '12h', label: '12-hour (1:30 PM)' },
    { value: '24h', label: '24-hour (13:30)' }
  ];

  const currencies = [
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' }
  ];

  const timezones = [
    { value: 'Asia/Kolkata', label: 'India (GMT+5:30)' },
    { value: 'America/New_York', label: 'New York (GMT-5:00)' },
    { value: 'Europe/London', label: 'London (GMT+0:00)' },
    { value: 'Asia/Singapore', label: 'Singapore (GMT+8:00)' }
  ];

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateSettings({
        language_preference: localSettings.language,
        date_format: localSettings.dateFormat,
        time_format: localSettings.timeFormat,
        currency: localSettings.currency,
        timezone: localSettings.timezone,
      });
      toast.success("Localization settings saved");
    } catch (error) {
      console.error('Error saving localization settings:', error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex justify-center items-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-20 md:pb-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight">Localization</h2>
          <p className="text-xs md:text-sm text-muted-foreground">Language, region, and formats</p>
        </div>
        <div className="p-2 bg-primary/10 rounded-full text-primary">
          <Globe className="w-4 h-4" />
        </div>
      </div>

      {/* Language Selection */}
      <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-3 md:p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Languages className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Language</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => setLocalSettings({ ...localSettings, language: lang.code })}
              className={`
                        relative flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                        ${localSettings.language === lang.code
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'}
                    `}
            >
              <span className="text-sm font-bold">{lang.name}</span>
              <span className="text-xs opacity-80">{lang.native}</span>
              {localSettings.language === lang.code && (
                <motion.div layoutId="lang-check" className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Regional Formats */}
      <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-3 md:p-4 shadow-sm space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-orange-500" />
            <h3 className="font-semibold text-sm">Date & Time</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-muted-foreground ml-1">Date Format</label>
              <select
                value={localSettings.dateFormat}
                onChange={(e) => setLocalSettings({ ...localSettings, dateFormat: e.target.value })}
                className="w-full text-xs h-9 px-3 bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {dateFormats.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-muted-foreground ml-1">Time Format</label>
              <select
                value={localSettings.timeFormat}
                onChange={(e) => setLocalSettings({ ...localSettings, timeFormat: e.target.value })}
                className="w-full text-xs h-9 px-3 bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {timeFormats.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Coins className="w-4 h-4 text-emerald-500" />
            <h3 className="font-semibold text-sm">Regional</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-muted-foreground ml-1">Currency</label>
              <select
                value={localSettings.currency}
                onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                className="w-full text-xs h-9 px-3 bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {currencies.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} - {c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-semibold text-muted-foreground ml-1">Timezone</label>
              <select
                value={localSettings.timezone}
                onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
                className="w-full text-xs h-9 px-3 bg-background border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {timezones.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSaveSettings} disabled={saving} className="w-full md:w-auto h-9 text-xs shadow-sm">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </Button>
      </div>
    </motion.div>
  );
};

export default LocalizationSettings;