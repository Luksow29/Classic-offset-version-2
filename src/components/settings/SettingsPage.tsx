import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import Card from '../ui/Card';
import UserProfileSettings from './UserProfileSettings';
import NotificationSettings from './NotificationSettings';
import AppearanceSettings from './AppearanceSettings';
import SecuritySettings from './SecuritySettings';
import IntegrationSettings from './IntegrationSettings';
import { Settings, Bell, Palette, Lock, Plug, Database, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import SystemSettings from './SystemSettings';
import LocalizationSettings from './LocalizationSettings';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs
          defaultValue={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <div className="bg-card border rounded-lg p-1">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden md:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden md:inline">Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="hidden md:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Plug className="h-4 w-4" />
                <span className="hidden md:inline">Integrations</span>
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="hidden md:inline">System</span>
              </TabsTrigger>
              <TabsTrigger value="localization" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden md:inline">Localization</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="profile" className="space-y-6">
            <UserProfileSettings />
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <AppearanceSettings />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <IntegrationSettings />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemSettings />
          </TabsContent>

          <TabsContent value="localization" className="space-y-6">
            <LocalizationSettings />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default SettingsPage;