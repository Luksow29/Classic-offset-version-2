import React, { useState } from 'react';
import PaymentForm from './PaymentForm';
import PaymentManagementTable from './PaymentManagementTable';
import PaymentDashboard from './PaymentDashboard';
import PaymentHistory from './PaymentHistory';
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
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">💳 Payment Management System</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Comprehensive payment tracking, analytics, and management
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon size={16} />
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
      </div>
    </div>
  );
};

export default EnhancedPayments;