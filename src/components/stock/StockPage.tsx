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
    <div className="space-y-3 sm:space-y-6 px-2 sm:px-4 py-3 sm:py-6">
      {/* Header Section - Compact on Mobile */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <Package className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
          <div>
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white">Stock</h1>
            <p className="text-gray-600 dark:text-gray-400 text-[10px] sm:text-sm hidden sm:block">
              Manage inventory and track usage.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <Button onClick={() => setShowUseModal(true)} variant="outline" className="gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm" size="sm">
            <Minus size={12} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Usage</span>
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm" size="sm">
            <Plus size={12} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {/* Tabs - Compact on Mobile */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 sm:space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`
              whitespace-nowrap py-2 sm:py-4 px-1 border-b-2 font-medium text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2
              ${activeTab === 'inventory'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <LayoutDashboard size={14} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Inventory</span>
            <span className="sm:hidden">Stock</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`
              whitespace-nowrap py-2 sm:py-4 px-1 border-b-2 font-medium text-[10px] sm:text-sm flex items-center gap-1 sm:gap-2
              ${activeTab === 'history'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <History size={14} className="sm:w-[18px] sm:h-[18px]" />
            History
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