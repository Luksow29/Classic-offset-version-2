import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import toast from 'react-hot-toast';

// Define the settings types
export interface UserSettings {
  id?: string;
  user_id: string;
  theme_preference: 'light' | 'dark' | 'system';
  font_size: 'small' | 'medium' | 'large';
  reduced_motion: boolean;
  high_contrast: boolean;
  color_scheme: string;
  language_preference: string;
  date_format: string;
  time_format: string;
  currency: string;
  timezone: string;
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
    whatsapp: boolean;
    frequency: 'realtime' | 'daily' | 'weekly';
    types: {
      orders: boolean;
      payments: boolean;
      stock: boolean;
      system: boolean;
    };
  };
  security_preferences: {
    two_factor_enabled: boolean;
    login_notifications: boolean;
  };
  created_at?: string;
  updated_at?: string;
}

// Default settings
export const defaultSettings: UserSettings = {
  user_id: '',
  theme_preference: 'system',
  font_size: 'medium',
  reduced_motion: false,
  high_contrast: false,
  color_scheme: 'blue',
  language_preference: 'en',
  date_format: 'DD/MM/YYYY',
  time_format: '24h',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  notification_preferences: {
    email: true,
    push: true,
    sms: false,
    whatsapp: false,
    frequency: 'realtime',
    types: {
      orders: true,
      payments: true,
      stock: true,
      system: true,
    },
  },
  security_preferences: {
    two_factor_enabled: false,
    login_notifications: true,
  },
};

interface SettingsContextType {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true,
  error: null,
  updateSettings: async () => false,
  refreshSettings: async () => { },
});

// Apply settings to the DOM
const applySettingsToDOM = (settings: UserSettings) => {
  // Apply theme
  if (settings.theme_preference !== 'system') {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(settings.theme_preference);
    document.documentElement.setAttribute('data-theme', settings.theme_preference);
    // Also save to localStorage for ThemeProvider sync
    localStorage.setItem('theme', settings.theme_preference);
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemTheme = prefersDark ? 'dark' : 'light';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(systemTheme);
    document.documentElement.setAttribute('data-theme', systemTheme);
    localStorage.removeItem('theme'); // Let system decide
  }

  // Apply font size
  const fontSizeMap = {
    small: '14px',
    medium: '16px',
    large: '18px',
  };
  document.documentElement.style.fontSize = fontSizeMap[settings.font_size] || '16px';

  // Apply reduced motion
  if (settings.reduced_motion) {
    document.documentElement.classList.add('reduce-motion');
  } else {
    document.documentElement.classList.remove('reduce-motion');
  }

  // Apply high contrast
  if (settings.high_contrast) {
    document.documentElement.classList.add('high-contrast');
  } else {
    document.documentElement.classList.remove('high-contrast');
  }

  // Apply color scheme
  document.documentElement.setAttribute('data-color-scheme', settings.color_scheme);

  console.log('[SettingsContext] Applied settings:', {
    theme: settings.theme_preference,
    fontSize: settings.font_size,
    colorScheme: settings.color_scheme,
  });
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings from Supabase
  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No settings found, create default settings
          console.log('[SettingsContext] No settings found, creating defaults...');
          const newSettings = {
            ...defaultSettings,
            user_id: user.id,
          };

          const { error: insertError } = await supabase
            .from('user_settings')
            .insert([newSettings]);

          if (insertError) {
            console.error('[SettingsContext] Error creating default settings:', insertError);
            throw insertError;
          }

          setSettings(newSettings);
          applySettingsToDOM(newSettings);
        } else {
          throw fetchError;
        }
      } else {
        console.log('[SettingsContext] Settings loaded from DB:', data);
        setSettings(data);
        applySettingsToDOM(data);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[SettingsContext] Error fetching settings:', err);
      setError(errorMessage);

      // Fall back to default settings
      const fallbackSettings = {
        ...defaultSettings,
        user_id: user.id,
      };
      setSettings(fallbackSettings);
      applySettingsToDOM(fallbackSettings);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update settings
  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!user || !settings) {
      toast.error('You must be logged in to update settings');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('user_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      applySettingsToDOM(updatedSettings);

      toast.success('Settings saved!');
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[SettingsContext] Error updating settings:', err);
      toast.error(`Failed to save settings: ${errorMessage}`);
      return false;
    }
  }, [user, settings]);

  // Fetch settings on user change
  useEffect(() => {
    if (user?.id) {
      fetchSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user?.id, fetchSettings]);

  const value = React.useMemo(() => ({
    settings,
    loading,
    error,
    updateSettings,
    refreshSettings: fetchSettings,
  }), [settings, loading, error, updateSettings, fetchSettings]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
