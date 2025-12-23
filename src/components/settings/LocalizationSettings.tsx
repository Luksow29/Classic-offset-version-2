import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Globe, Loader2, Languages } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';

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
    { code: 'en', name: 'English' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' }
  ];

  const dateFormats = [
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2025)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2025)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-31)' },
    { value: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY (31-Dec-2025)' }
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
    } catch (error) {
      console.error('Error saving localization settings:', error);
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
    <Card className="p-4 sm:p-6">
      <div className="space-y-8">
        {/* Language */}
        <div>
          <h3 className="text-lg font-medium mb-4">Language</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {languages.map(lang => (
              <div
                key={lang.code}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${localSettings.language === lang.code ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                onClick={() => setLocalSettings({ ...localSettings, language: lang.code })}
              >
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{lang.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Date & Time Format */}
        <div>
          <h3 className="text-lg font-medium mb-4">Date & Time Format</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Date Format</label>
              <select
                value={localSettings.dateFormat}
                onChange={(e) => setLocalSettings({ ...localSettings, dateFormat: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {dateFormats.map(format => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Time Format</label>
              <select
                value={localSettings.timeFormat}
                onChange={(e) => setLocalSettings({ ...localSettings, timeFormat: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {timeFormats.map(format => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Currency & Timezone */}
        <div>
          <h3 className="text-lg font-medium mb-4">Currency & Timezone</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Currency</label>
              <select
                value={localSettings.currency}
                onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {currencies.map(curr => (
                  <option key={curr.code} value={curr.code}>{curr.symbol} - {curr.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <select
                value={localSettings.timezone}
                onChange={(e) => setLocalSettings({ ...localSettings, timezone: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {timezones.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div>
          <h3 className="text-lg font-medium mb-4">Preview</h3>
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-1">Date & Time</p>
                <p className="text-muted-foreground">
                  {new Date().toLocaleDateString(
                    localSettings.language === 'en' ? 'en-US' : localSettings.language === 'ta' ? 'ta-IN' : 'en-IN',
                    {
                      year: 'numeric',
                      month: localSettings.dateFormat.includes('MMM') ? 'short' : 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: localSettings.timeFormat === '12h'
                    }
                  )}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Currency</p>
                <p className="text-muted-foreground">
                  {new Intl.NumberFormat(
                    localSettings.language === 'en' ? 'en-US' : localSettings.language === 'ta' ? 'ta-IN' : 'en-IN',
                    {
                      style: 'currency',
                      currency: localSettings.currency
                    }
                  ).format(1234.56)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSaveSettings} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Localization Settings'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LocalizationSettings;