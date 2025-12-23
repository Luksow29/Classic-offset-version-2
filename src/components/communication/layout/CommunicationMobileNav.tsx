import React, { useRef, useEffect } from 'react';
import { MessageCircle, MessageSquare, Package, LifeBuoy, Brain } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface CommunicationMobileNavProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
}

const ITEMS = [
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={18} /> },
    { id: 'team_chat', label: 'Team', icon: <MessageSquare size={18} /> },
    { id: 'support', label: 'Support', icon: <LifeBuoy size={18} /> },
    { id: 'order_chat', label: 'Orders', icon: <Package size={18} /> },
    { id: 'ai_assistant', label: 'AI', icon: <Brain size={18} /> },
];

const CommunicationMobileNav: React.FC<CommunicationMobileNavProps> = ({ activeTab, setActiveTab }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to active item on mount
    useEffect(() => {
        if (scrollRef.current) {
            const activeElement = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement;
            if (activeElement) {
                // Ensure the active tab is visible but don't force it to center if unnecessary
                // We use scrollLeft instead of scrollIntoView to prevent whole page scrolling behavior
                const container = scrollRef.current;
                const offsetLeft = activeElement.offsetLeft;
                const containerWidth = container.clientWidth;
                const itemWidth = activeElement.clientWidth;

                // Simple logic: scroll so item is roughly centered
                container.scrollTo({
                    left: offsetLeft - containerWidth / 2 + itemWidth / 2,
                    behavior: 'smooth'
                });
            }
        }
    }, [activeTab]); // Run when activeTab changes

    return (
        <div className="lg:hidden bg-card border-b border-border sticky top-0 z-10 w-full overflow-hidden">
            <div
                ref={scrollRef}
                className="flex items-center gap-2 p-2 overflow-x-auto no-scrollbar scroll-smooth"
            >
                {ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            data-active={isActive}
                            onClick={() => setActiveTab(item.id)}
                            className={twMerge(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CommunicationMobileNav;
