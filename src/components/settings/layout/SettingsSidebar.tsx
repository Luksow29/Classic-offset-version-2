import React from 'react';
import { Settings, Bell, Palette, Lock, Plug, Database, Globe, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface SettingsSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'integrations', label: 'Integrations', icon: Plug },
    { id: 'system', label: 'System', icon: Database },
    { id: 'localization', label: 'Localization', icon: Globe },
];

const SettingsSidebar: React.FC<SettingsSidebarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col h-full">
            <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Settings className="w-6 h-6 text-primary" />
                    Settings
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Manage your preferences</p>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTabIndicator"
                                    className="absolute left-0 w-1 h-full bg-primary rounded-r-full" // Use left border indicator
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    style={{ top: 0, bottom: 0 }} // Stretch to fill height
                                />
                            )}
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                            {item.label}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};

export default SettingsSidebar;
