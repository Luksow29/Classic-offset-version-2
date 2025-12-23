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
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <BarChart3 size={24} />
            </div>
            <h1 className="text-2xl font-bold font-display text-foreground">Payment Management</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-12">
            Comprehensive payment tracking, analytics, and management
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-4 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
              >
                <Icon size={18} />
                {tab.label}
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
