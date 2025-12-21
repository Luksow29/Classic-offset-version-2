// src/components/orders/Orders.tsx

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import UnifiedOrderWizard from './UnifiedOrderWizard';
import OrdersTable from './OrdersTable';
import { Plus, List, Package, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/context/UserContext';
import { hasAnyStaffRole } from '@/lib/rbac';

const Orders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('manage');
  const [searchParams] = useSearchParams(); 
  const { userProfile } = useUser();
  const canCreateOrder = hasAnyStaffRole(userProfile?.role, ['owner', 'manager', 'office']);
  
  const highlightOrderId = searchParams.get('highlight');

  useEffect(() => {
    if (highlightOrderId) {
      setActiveTab('manage');
    }
  }, [highlightOrderId]);

  useEffect(() => {
    if (!canCreateOrder && activeTab === 'add') {
      setActiveTab('manage');
    }
  }, [activeTab, canCreateOrder]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-950 dark:via-blue-950/20 dark:to-indigo-950/30">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none hidden sm:block">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400/15 to-pink-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-br from-cyan-400/10 to-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                Orders Management
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Create, view, and manage all your customer orders efficiently
              </p>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-3 flex-wrap">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-full border border-gray-200/60 dark:border-gray-700/60 shadow-sm"
            >
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Orders Today</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-full border border-gray-200/60 dark:border-gray-700/60 shadow-sm"
            >
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-full border border-gray-200/60 dark:border-gray-700/60 shadow-sm"
            >
              <CheckCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completed</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Modern Tab Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <div className="flex w-full sm:w-fit p-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-700/60 shadow-lg shadow-gray-200/40 dark:shadow-gray-900/40">
            <button
              onClick={() => setActiveTab('manage')}
              className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-300 rounded-xl ${
                activeTab === 'manage'
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
              }`}
            >
              {activeTab === 'manage' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <List size={18} className="relative z-10" />
              <span className="relative z-10 sm:hidden">Manage</span>
              <span className="relative z-10 hidden sm:inline">Manage Orders</span>
            </button>
            {canCreateOrder && (
              <button
                onClick={() => setActiveTab('add')}
                className={`relative flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all duration-300 rounded-xl ${
                  activeTab === 'add'
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                }`}
              >
                {activeTab === 'add' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Plus size={18} className="relative z-10" />
                <span className="relative z-10 sm:hidden">Add</span>
                <span className="relative z-10 hidden sm:inline">Add New Order</span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Tab Content with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'manage' ? (
              <OrdersTable highlightOrderId={highlightOrderId} />
            ) : (
              <motion.div 
                className="max-w-5xl mx-auto"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl p-4 sm:p-6 lg:p-8 rounded-3xl shadow-xl shadow-gray-200/40 dark:shadow-gray-900/40 border border-gray-200/60 dark:border-gray-700/60">
                  <UnifiedOrderWizard onSuccess={() => setActiveTab('manage')} />
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Orders;
