import React from 'react';
import StockForm from './StockForm';
import UseStockForm from './UseStockForm';
import StockHistory from './StockHistory';
import ComprehensiveStockView from './ComprehensiveStockView';

const StockPage: React.FC = () => {
  return (
    <div className="space-y-6 px-4 py-6">
      {/* Main Heading Section */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2">
          📦 Existing Stock Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          Comprehensive view and management of your current inventory. Track usage, monitor levels, and maintain stock records.
        </p>
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="inline-block mr-4">📊 Unified Inventory View</span>
          <span className="inline-block mr-4">📤 Usage Tracking</span>
          <span className="inline-block mr-4">➕ Add New Items</span>
          <span className="inline-block">📅 Transaction History</span>
        </div>
      </div>

      {/* ✅ PRIMARY: Comprehensive Stock View - Main Feature */}
      <ComprehensiveStockView />
      
      {/* ✅ SECONDARY: Essential Stock Management Tools */}
      <UseStockForm />        {/* 📤 Record stock usage */}
      <StockForm />           {/* ➕ Add new stock items */}
      <StockHistory />        {/* 📅 View usage history */}
    </div>
  );
};

export default StockPage;