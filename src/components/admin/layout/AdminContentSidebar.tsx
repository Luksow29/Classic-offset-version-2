import React from 'react';
import { Image, FileText, Users, ClipboardList, Settings, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminContentSidebarProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
}

const navItems = [
    { id: 'showcase', label: 'Showcase Content', icon: Image, description: 'Manage gallery & features' },
    { id: 'templates', label: 'Template Management', icon: FileText, description: 'WhatsApp templates' },
    { id: 'staff_management', label: 'Staff Management', icon: Users, description: 'Employees & logs' },
    { id: 'order_requests', label: 'Order Requests', icon: ClipboardList, description: 'View and manage requests' },
    { id: 'others', label: 'Other Admin Links', icon: Settings, description: 'Quick access links' },
];

const AdminContentSidebar: React.FC<AdminContentSidebarProps> = ({ activeTab, setActiveTab }) => {
    return (
        <div className="hidden md:flex flex-col w-64 bg-card border-r border-border h-full flex-shrink-0">
            <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">
                    Admin Content
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Manage portal content</p>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full group flex items-start text-left p-3 rounded-lg transition-all duration-200 border border-transparent ${isActive
                                    ? 'bg-primary/5 border-primary/10 shadow-sm'
                                    : 'hover:bg-muted hover:border-border/50'
                                }`}
                        >
                            <div className={`mt-0.5 p-2 rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'
                                }`}>
                                <item.icon size={18} />
                            </div>
                            <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                    <span className={`font-medium text-sm ${isActive ? 'text-primary' : 'text-foreground'}`}>
                                        {item.label}
                                    </span>
                                    {isActive && <ChevronRight size={14} className="text-primary ml-1" />}
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                                    {item.description}
                                </p>
                            </div>
                            {isActive && (
                                <motion.div
                                    layoutId="activeAdminTab"
                                    className="absolute left-0 w-1 h-8 bg-primary rounded-r-full my-auto top-0 bottom-0"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="p-4 border-t border-border bg-muted/20">
                <div className="text-xs text-center text-muted-foreground">
                    Admin Portal v1.0.0
                </div>
            </div>
        </div>
    );
};

export default AdminContentSidebar;
