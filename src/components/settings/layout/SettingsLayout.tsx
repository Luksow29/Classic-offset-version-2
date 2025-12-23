import React from 'react';
import SettingsSidebar from './SettingsSidebar';
import SettingsMobileNav from './SettingsMobileNav';

interface SettingsLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children, activeTab, setActiveTab }) => {
    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] md:flex-row bg-background overflow-hidden">
            <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <SettingsMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="max-w-4xl mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsLayout;
