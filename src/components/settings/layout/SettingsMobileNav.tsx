import React, { useRef, useEffect } from 'react';
import { Settings, Bell, Palette, Lock, Plug, Database, Globe, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface SettingsMobileNavProps {
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

const SettingsMobileNav: React.FC<SettingsMobileNavProps> = ({ activeTab, setActiveTab }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            const activeItem = scrollRef.current.querySelector<HTMLElement>('[data-active="true"]');
            if (activeItem) {
                const container = scrollRef.current;
                const scrollLeft = activeItem.offsetLeft - (container.clientWidth / 2) + (activeItem.clientWidth / 2);
                container.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeTab]);

    return (
        <div className="md:hidden bg-card border-b border-border sticky top-0 z-30">
            <div className="flex overflow-x-auto scrollbar-hide py-2 px-4 gap-2" ref={scrollRef}>
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            data-active={isActive}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[70px] py-2 px-1 rounded-lg transition-colors whitespace-nowrap gap-1 ${isActive
                                ? 'text-primary bg-primary/5'
                                : 'text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive ? 'fill-current/20' : ''}`} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="activeMobileTab"
                                    className="absolute bottom-0 h-0.5 w-full bg-primary rounded-t-full"
                                    initial={false}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default SettingsMobileNav;
