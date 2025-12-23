import React, { ReactNode } from 'react';
import CommunicationSidebar from './CommunicationSidebar';
import CommunicationMobileNav from './CommunicationMobileNav';
import { motion, AnimatePresence } from 'framer-motion';

interface CommunicationLayoutProps {
    children: ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const CommunicationLayout: React.FC<CommunicationLayoutProps> = ({
    children,
    activeTab,
    setActiveTab
}) => {
    return (
        <div className="flex flex-col lg:flex-row h-full w-full bg-background overflow-hidden relative">
            {/* Sidebar for Desktop */}
            <CommunicationSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
                {/* Mobile Navigation */}
                <CommunicationMobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Scrollable Content */}
                <div className="flex-1 overflow-hidden bg-muted/20 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full w-full"
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default CommunicationLayout;
