// src/components/orders/Orders.tsx

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import OrderForm from './OrderForm';
import OrdersTable from './OrdersTable';
import { Plus, List } from 'lucide-react';

const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('manage');
  const [searchParams] = useSearchParams(); 
  
  const highlightOrderId = searchParams.get('highlight');

  useEffect(() => {
    if (highlightOrderId) {
      setActiveTab('manage');
    }
  }, [highlightOrderId]);

  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Orders Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Create, view, and manage all your customer orders.</p>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('manage')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors -mb-px rounded-t-lg ${
            activeTab === 'manage'
              ? 'bg-white dark:bg-gray-800 border border-b-0 border-gray-200 dark:border-gray-700 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <List size={16} />
          Manage Orders
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors -mb-px rounded-t-lg ${
            activeTab === 'add'
              ? 'bg-white dark:bg-gray-800 border border-b-0 border-gray-200 dark:border-gray-700 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Plus size={16} />
          Add New Order
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-0"> {/* Margin is handled by the container */}
        {activeTab === 'manage' ? (
          <OrdersTable highlightOrderId={highlightOrderId} />
        ) : (
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <OrderForm onSuccess={() => setActiveTab('manage')} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;