import React from 'react';
import AdminContentSidebar from './AdminContentSidebar';
import AdminContentMobileNav from './AdminContentMobileNav';

interface AdminContentLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: any) => void;
}

const AdminContentLayout: React.FC<AdminContentLayoutProps> = ({ children, activeTab, setActiveTab }) => {
    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] md:flex-row bg-background overflow-hidden">
            <AdminContentSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <AdminContentMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-6 pb-20 md:pb-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminContentLayout;
