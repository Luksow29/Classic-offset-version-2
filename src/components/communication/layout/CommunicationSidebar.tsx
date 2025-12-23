import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, MessageSquare, Package, LifeBuoy, ChevronLeft, ChevronRight, Brain } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface CommunicationSidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
}

const ITEMS = [
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={18} /> },
    { id: 'team_chat', label: 'Team Chat', icon: <MessageSquare size={18} /> },
    { id: 'support', label: 'Support', icon: <LifeBuoy size={18} /> },
    { id: 'order_chat', label: 'Order Chat', icon: <Package size={18} /> },
    { id: 'ai_assistant', label: 'AI Assistant', icon: <Brain size={18} /> },
];

const CommunicationSidebar: React.FC<CommunicationSidebarProps> = ({ activeTab, setActiveTab }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <motion.div
            className="hidden lg:flex flex-col border-r border-border h-full bg-card/50 backdrop-blur-xl transition-all duration-300 relative"
            initial={{ width: 256 }}
            animate={{ width: isCollapsed ? 64 : 256 }}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-4 bg-background border border-border rounded-full p-1 shadow-md hover:bg-muted transition-colors z-10"
            >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>

            <div className={`p-4 border-b border-border flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} h-16 flex-shrink-0`}>
                <div className="flex items-center gap-2 overflow-hidden">
                    <MessageCircle className="w-6 h-6 text-primary flex-shrink-0" />
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="whitespace-nowrap"
                        >
                            <h2 className="font-semibold text-lg">Communication</h2>
                        </motion.div>
                    )}
                </div>
            </div>

            <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
                {ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={twMerge(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                                isActive
                                    ? "bg-primary/20 text-primary"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                                isCollapsed ? "justify-center" : ""
                            )}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className={isActive ? "text-primary" : "text-muted-foreground"}>
                                {item.icon}
                            </span>

                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="whitespace-nowrap"
                                >
                                    {item.label}
                                </motion.span>
                            )}

                            {isActive && !isCollapsed && (
                                <motion.div
                                    layoutId="communication-active-indicator"
                                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                                />
                            )}
                        </button>
                    );
                })}
            </nav>

            {!isCollapsed && (
                <div className="p-4 border-t border-border mt-auto flex-shrink-0">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="bg-muted/30 p-3 rounded-lg border border-border"
                    >
                        <p className="text-xs text-muted-foreground text-center">
                            Unified Hub
                        </p>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
};

export default CommunicationSidebar;
