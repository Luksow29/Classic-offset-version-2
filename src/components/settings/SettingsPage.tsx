import React, { useState } from 'react';
import UserProfileSettings from './UserProfileSettings';
import NotificationSettings from './NotificationSettings';
import AppearanceSettings from './AppearanceSettings';
import SecuritySettings from './SecuritySettings';
import IntegrationSettings from './IntegrationSettings';
import { motion, AnimatePresence } from 'framer-motion';
import SystemSettings from './SystemSettings';
import LocalizationSettings from './LocalizationSettings';
import SettingsLayout from './layout/SettingsLayout';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <UserProfileSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'integrations':
        return <IntegrationSettings />;
      case 'system':
        return <SystemSettings />;
      case 'localization':
        return <LocalizationSettings />;
      default:
        return <UserProfileSettings />;
    }
  };

  return (
    <SettingsLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground capitalize">
              {activeTab === 'profile' ? 'User Profile' :
                activeTab === 'system' ? 'System Configuration' :
                  activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Manage your {activeTab} settings and preferences
            </p>
          </div>
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </SettingsLayout>
  );
};

export default SettingsPage;