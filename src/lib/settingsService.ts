import { supabase } from './supabaseClient';
import { useUser } from '@/context/UserContext';
import { useState, useEffect } from 'react';
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

// Hook to fetch and manage user settings
export function useUserSettings() {
  const { user } = useUser();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch settings from Supabase
  const fetchSettings = async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, create default settings
          const newSettings = {
            ...defaultSettings,
            user_id: user.id,
          };
          
          const { error: insertError } = await supabase
            .from('user_settings')
            .insert([newSettings]);
            
          if (insertError) throw insertError;
          
          setSettings(newSettings);
        } else {
          throw error;
        }
      } else {
        setSettings(data);
      }
    } catch (err: any) {
      console.error('Error fetching user settings:', err);
      setError(err.message);
      
      // Fall back to default settings
      setSettings({
        ...defaultSettings,
        user_id: user.id,
      });
    } finally {
      setLoading(false);
    }
  };

  // Update settings in Supabase
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user || !settings) {
      toast.error('You must be logged in to update settings');
      return;
    }

    try {
      const { error } = await supabase
        .from('user_settings')
        .update({
          ...newSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
      toast.success('Settings updated successfully');
      
      // Apply settings immediately
      applySettings({ ...settings, ...newSettings });
      
      return true;
    } catch (err: any) {
      console.error('Error updating settings:', err);
      toast.error(`Failed to update settings: ${err.message}`);
      return false;
    }
  };

  // Apply settings to the application
  const applySettings = (settingsToApply: UserSettings) => {
    // Apply theme
    if (settingsToApply.theme_preference !== 'system') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(settingsToApply.theme_preference);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    }

    // Apply font size
    document.documentElement.style.fontSize = 
      settingsToApply.font_size === 'small' ? '14px' : 
      settingsToApply.font_size === 'large' ? '18px' : '16px';
    
    // Apply reduced motion
    if (settingsToApply.reduced_motion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
    
    // Apply high contrast
    if (settingsToApply.high_contrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    // Apply color scheme
    // This would typically involve updating CSS variables or theme classes
    document.documentElement.setAttribute('data-color-scheme', settingsToApply.color_scheme);
  };

  // Fetch settings on mount and when user changes
  useEffect(() => {
    fetchSettings();
  }, [user?.id]);

  // Apply settings when they change
  useEffect(() => {
    if (settings) {
      applySettings(settings);
    }
  }, [settings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    fetchSettings,
  };
}

// Function to create the user_settings table in Supabase if it doesn't exist
export async function ensureSettingsTableExists() {
  const { error } = await supabase.rpc('ensure_settings_table_exists');
  if (error) {
    console.error('Error ensuring settings table exists:', error);
  }
}