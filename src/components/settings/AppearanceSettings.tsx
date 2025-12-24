// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/lib/ThemeProvider';
import { Sun, Moon, Monitor, Check, Type, Smartphone, Eye, CheckCircle2, MonitorSmartphone, Palette } from 'lucide-react';
import Button from '../ui/Button';
import { useSettings } from '@/context/SettingsContext';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const AppearanceSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { settings, updateSettings, loading } = useSettings();

  const [localSettings, setLocalSettings] = useState({
    fontSize: 'medium',
    reducedMotion: false,
    highContrast: false,
    colorScheme: 'blue',
  });

  // Sync local state with settings from Supabase
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        fontSize: settings.font_size || 'medium',
        reducedMotion: settings.reduced_motion || false,
        highContrast: settings.high_contrast || false,
        colorScheme: settings.color_scheme || 'blue',
      });
    }
  }, [settings]);

  const handleSaveAppearance = async () => {
    await updateSettings({
      theme_preference: theme as 'light' | 'dark' | 'system',
      font_size: localSettings.fontSize as 'small' | 'medium' | 'large',
      reduced_motion: localSettings.reducedMotion,
      high_contrast: localSettings.highContrast,
      color_scheme: localSettings.colorScheme,
    });
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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const colorSchemes = [
    { id: 'blue', name: 'Blue', color: 'bg-blue-500' },
    { id: 'green', name: 'Green', color: 'bg-green-500' },
    { id: 'purple', name: 'Violet', color: 'bg-purple-500' },
    { id: 'orange', name: 'Orange', color: 'bg-orange-500' },
    { id: 'pink', name: 'Rose', color: 'bg-pink-500' },
    { id: 'teal', name: 'Teal', color: 'bg-teal-500' },
    { id: 'red', name: 'Red', color: 'bg-red-500' },
    { id: 'gray', name: 'Gray', color: 'bg-slate-500' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 md:space-y-8 max-w-4xl"
    >
      <div className="flex items-center justify-between pb-3 md:pb-6 border-b border-border">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Appearance</h2>
          <p className="text-xs md:text-base text-muted-foreground mt-0.5 md:mt-1">Customize the look and feel.</p>
        </div>
        <Button onClick={handleSaveAppearance} size="sm" className="shadow-lg shadow-primary/20 h-8 md:h-10 text-xs md:text-sm">
          Save
        </Button>
      </div>

      {/* Theme Selection */}
      <motion.section variants={itemVariants} className="space-y-2 md:space-y-4">
        <div className="flex items-center gap-2 mb-2 md:mb-4">
          <div className="p-1 md:p-2 rounded-lg bg-primary/10 text-primary">
            <MonitorSmartphone className="w-3.5 h-3.5 md:w-5 md:h-5" />
          </div>
          <h3 className="text-sm md:text-lg font-semibold">Interface Theme</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
          <ThemeCard
            active={theme === 'light'}
            onClick={() => setTheme('light')}
            icon={<Sun className="w-4 h-4 md:w-6 md:h-6 text-amber-500" />}
            title="Light"
            description="Clean & bright."
            previewClass="bg-white border-2 border-slate-100"
          />
          <ThemeCard
            active={theme === 'dark'}
            onClick={() => setTheme('dark')}
            icon={<Moon className="w-4 h-4 md:w-6 md:h-6 text-indigo-400" />}
            title="Dark"
            description="Easy on eyes."
            previewClass="bg-slate-900 border-2 border-slate-700"
          />
          <ThemeCard
            active={theme === 'system'}
            onClick={() => setTheme('system')}
            icon={<Monitor className="w-4 h-4 md:w-6 md:h-6 text-slate-500" />}
            title="System"
            description="Auto-detect."
            previewClass="bg-gradient-to-br from-white to-slate-900 border-2 border-slate-200"
          />
        </div>
      </motion.section>

      {/* Font Size */}
      <motion.section variants={itemVariants} className="space-y-2 md:space-y-4 pt-3 md:pt-6">
        <div className="flex items-center gap-2 mb-2 md:mb-4">
          <div className="p-1 md:p-2 rounded-lg bg-primary/10 text-primary">
            <Type className="w-3.5 h-3.5 md:w-5 md:h-5" />
          </div>
          <h3 className="text-sm md:text-lg font-semibold">Typography Scale</h3>
        </div>

        <div className="bg-card border border-border rounded-xl p-1 grid grid-cols-3 gap-1">
          {['small', 'medium', 'large'].map((size) => (
            <button
              key={size}
              onClick={() => setLocalSettings({ ...localSettings, fontSize: size as any })}
              className={`
                        relative flex flex-col items-center justify-center py-2 md:py-6 rounded-lg transition-all duration-200
                        ${localSettings.fontSize === size
                  ? 'bg-primary/10 text-primary ring-2 ring-primary ring-inset z-10'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'}
                    `}
            >
              <span className={`font-bold mb-0.5 md:mb-2 ${size === 'small' ? 'text-sm' : size === 'medium' ? 'text-base' : 'text-xl'}`}>
                Aa
              </span>
              <span className="text-[9px] md:text-xs font-medium capitalize">{size}</span>
              {localSettings.fontSize === size && (
                <div className="absolute top-1 right-1 md:top-2 md:right-2 text-primary">
                  <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4" />
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.section>

      {/* Color Scheme */}
      <motion.section variants={itemVariants} className="space-y-2 md:space-y-4 pt-3 md:pt-6">
        <div className="flex items-center gap-2 mb-2 md:mb-4">
          <div className="p-1 md:p-2 rounded-lg bg-primary/10 text-primary">
            <Palette className="w-3.5 h-3.5 md:w-5 md:h-5" />
          </div>
          <h3 className="text-sm md:text-lg font-semibold">Accent Color</h3>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 md:gap-4">
          {colorSchemes.map((scheme) => (
            <motion.div
              key={scheme.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLocalSettings({ ...localSettings, colorScheme: scheme.id })}
              className={`
                group relative cursor-pointer rounded-xl border p-1 md:p-3 flex flex-col items-center gap-1.5 md:gap-2 transition-all
                ${localSettings.colorScheme === scheme.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/30'}
              `}
            >
              <div className={`w-5 h-5 md:w-8 md:h-8 rounded-full ${scheme.color} shadow-sm group-hover:scale-110 transition-transform`} />
              <span className="text-[9px] md:text-xs font-medium truncate w-full text-center">{scheme.name}</span>
              {localSettings.colorScheme === scheme.id && (
                <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-primary text-primary-foreground rounded-full p-0.5 shadow-md">
                  <Check className="w-2 h-2 md:w-3 md:h-3" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Accessibility */}
      <motion.section variants={itemVariants} className="space-y-2 md:space-y-4 pt-3 md:pt-6">
        <div className="flex items-center gap-2 mb-2 md:mb-4">
          <div className="p-1 md:p-2 rounded-lg bg-primary/10 text-primary">
            <Eye className="w-3.5 h-3.5 md:w-5 md:h-5" />
          </div>
          <h3 className="text-sm md:text-lg font-semibold">Accessibility</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6">
          <AccessibilityCard
            title="Reduced Motion"
            description="Minimize animations."
            icon={<Smartphone className="w-3.5 h-3.5 md:w-5 md:h-5" />}
            checked={localSettings.reducedMotion}
            onChange={() => setLocalSettings({ ...localSettings, reducedMotion: !localSettings.reducedMotion })}
          />
          <AccessibilityCard
            title="High Contrast"
            description="Increase visibility."
            icon={<Eye className="w-3.5 h-3.5 md:w-5 md:h-5" />}
            checked={localSettings.highContrast}
            onChange={() => setLocalSettings({ ...localSettings, highContrast: !localSettings.highContrast })}
          />
        </div>
      </motion.section>
    </motion.div>
  );
};

const ThemeCard = ({ active, onClick, icon, title, description, previewClass }: any) => (
  <motion.button
    whileHover={{ y: -4 }}
    onClick={onClick}
    className={`
      relative p-2 md:p-6 rounded-xl border-2 text-left transition-all duration-200 w-full flex flex-col h-full
      ${active
        ? 'border-primary bg-primary/5 ring-2 md:ring-4 ring-primary/10'
        : 'border-border bg-card hover:border-primary/50 hover:shadow-md'}
    `}
  >
    <div className="flex justify-between items-start mb-1 md:mb-4">
      <div className={`p-1.5 md:p-3 rounded-full bg-background border shadow-sm`}>
        {icon}
      </div>
      {active && (
        <span className="flex h-4 w-4 md:h-6 md:w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" />
        </span>
      )}
    </div>

    <div className="mt-auto">
      <h4 className={`font-bold text-xs md:text-base mb-0.5 md:mb-1 ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{title}</h4>
      <p className="hidden md:block text-xs text-muted-foreground">{description}</p>
    </div>

    {/* Decorative Preview Element - Aggressively reduced height on mobile */}
    <div className={`mt-2 md:mt-4 h-8 md:h-24 rounded-lg w-full ${previewClass} relative overflow-hidden opacity-80`}>
      <div className="absolute top-1.5 md:top-3 left-1.5 md:left-3 right-1.5 md:right-3 h-1 md:h-2 rounded-full bg-current opacity-10"></div>
      <div className="absolute top-3.5 md:top-8 left-1.5 md:left-3 w-1/2 h-1 md:h-2 rounded-full bg-current opacity-10"></div>
      <div className="absolute bottom-1.5 md:bottom-3 right-1.5 md:right-3 w-4 h-4 md:w-8 md:h-8 rounded-full bg-blue-500/20"></div>
    </div>
  </motion.button>
);

const AccessibilityCard = ({ title, description, icon, checked, onChange }: any) => (
  <div className="flex items-center justify-between p-2 md:p-5 rounded-xl border border-border bg-card hover:shadow-md transition-all">
    <div className="flex items-start gap-2 md:gap-4">
      <div className="mt-0.5 md:mt-1 text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="font-medium text-xs md:text-base text-foreground">{title}</p>
        <p className="text-[10px] md:text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
    <label className="relative inline-flex items-center cursor-pointer ml-2">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      {/* Smaller switch on mobile */}
      <div className="w-8 h-4 md:w-11 md:h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 md:after:h-5 md:after:w-5 after:transition-all peer-checked:bg-primary"></div>
    </label>
  </div>
);

export default AppearanceSettings;
