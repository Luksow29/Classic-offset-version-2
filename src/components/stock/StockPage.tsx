import React, { useState } from 'react';
import StockForm from './StockForm';
import UseStockForm from './UseStockForm';
import StockHistory from './StockHistory';
import ComprehensiveStockView from './ComprehensiveStockView';
import { Package, History, Plus, Minus, LayoutDashboard } from 'lucide-react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';

const StockPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Stock Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
            Manage inventory, track usage, and view transaction history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowUseModal(true)} variant="outline" className="gap-2">
            <Minus size={16} /> Record Usage
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus size={16} /> Add New Item
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'inventory'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <LayoutDashboard size={18} />
            Inventory Dashboard
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
              ${activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <History size={18} />
            Transaction History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'inventory' ? (
          <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            <ComprehensiveStockView />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <StockHistory />
          </div>
        )}
      </div>

      {/* Modals for Actions */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Stock Item"
        size="lg"
      >
        <div className="pt-4">
          {/* Pass onClose to close modal on success if supported, or just render */}
          <StockForm />
        </div>
      </Modal>

      <Modal
        isOpen={showUseModal}
        onClose={() => setShowUseModal(false)}
        title="Record Stock Usage"
        size="lg"
      >
        <div className="pt-4">
          <UseStockForm />
        </div>
      </Modal>
    </div>
  );
};

export default StockPage;