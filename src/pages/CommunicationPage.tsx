import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CommunicationLayout from '@/components/communication/layout/CommunicationLayout';
import WhatsAppTab from '@/components/communication/tabs/WhatsAppTab';
import TeamChatTab from '@/components/communication/tabs/TeamChatTab';
import SupportTab from '@/components/communication/tabs/SupportTab';
import OrderChatTab from '@/components/communication/tabs/OrderChatTab';
import AIAssistantTab from '@/components/communication/tabs/AIAssistantTab';

const CommunicationPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTabState] = useState(() => searchParams.get('tab') || 'whatsapp');

    // Sync state with URL
    useEffect(() => {
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTabState(tabFromUrl);
        } else if (!tabFromUrl) {
            // Default to whatsapp if no tab params
            setSearchParams({ tab: 'whatsapp' }, { replace: true });
        }
    }, [searchParams]);

    const handleTabChange = (tabId: string) => {
        setActiveTabState(tabId);
        setSearchParams({ tab: tabId });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'whatsapp':
                return <WhatsAppTab />;
            case 'team_chat':
                return <TeamChatTab />;
            case 'support':
                return <SupportTab />;
            case 'order_chat':
                return <OrderChatTab />;
            case 'ai_assistant':
                return <AIAssistantTab />;
            default:
                return <WhatsAppTab />;
        }
    };

    return (
        <CommunicationLayout activeTab={activeTab} setActiveTab={handleTabChange}>
            {renderContent()}
        </CommunicationLayout>
    );
};

export default CommunicationPage;
