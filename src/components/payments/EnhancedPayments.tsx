import React, { useState } from 'react';
import PaymentForm from './PaymentForm';
import PaymentManagementTable from './PaymentManagementTable';
import PaymentDashboard from './PaymentDashboard';
import PaymentHistory from './PaymentHistory';
import TriggerMissingPayments from './TriggerMissingPayments';
import { BarChart3, PlusCircle, List, History, Settings } from 'lucide-react';

type TabType = 'dashboard' | 'manage' | 'add' | 'history' | 'settings';

const EnhancedPayments: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePaymentSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('manage'); // Switch to management view after adding payment
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Analytics', icon: BarChart3 },
    { id: 'manage' as TabType, label: 'Manage Payments', icon: List },
    { id: 'add' as TabType, label: 'Add Payment', icon: PlusCircle },
    { id: 'history' as TabType, label: 'History & Audit', icon: History },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-6">
      {/* Header - Compact on Mobile */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg text-primary">
          <BarChart3 size={16} className="sm:w-6 sm:h-6" />
        </div>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold font-display text-foreground">Payments</h1>
          <p className="text-muted-foreground text-[10px] sm:text-sm hidden sm:block">
            Payment tracking, analytics, and management
          </p>
        </div>
      </div>

      {/* Tab Navigation - Compact on Mobile */}
      <div className="border-b border-border">
        <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto pb-1 -mb-px scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-1 py-2 sm:py-4 text-[10px] sm:text-sm font-medium transition-all border-b-2 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
              >
                <Icon size={14} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'dashboard' && (
          <PaymentDashboard />
        )}

        {activeTab === 'manage' && (
          <PaymentManagementTable key={refreshKey} />
        )}

        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto">
            <PaymentForm onSuccess={handlePaymentSuccess} />
          </div>
        )}

        {activeTab === 'history' && (
          <PaymentHistory />
        )}

        {activeTab === 'settings' && (
          <TriggerMissingPayments />
        )}
      </div>
    </div>
  );
};

export default EnhancedPayments;
