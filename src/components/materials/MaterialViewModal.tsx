import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Package, Tag, User, MapPin, Calendar, DollarSign, TrendingUp, History } from 'lucide-react';
import { Material, MaterialTransaction } from './MaterialsPage';
import { supabase } from '@/lib/supabaseClient';

interface MaterialViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
}

const MaterialViewModal: React.FC<MaterialViewModalProps> = ({ isOpen, onClose, material }) => {
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (isOpen && material) {
      fetchTransactions();
    }
  }, [isOpen, material]);

  const fetchTransactions = async () => {
    if (!material) return;
    
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('material_transactions')
        .select('*')
        .eq('material_id', material.id)
        .order('transaction_date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  if (!isOpen || !material) {
    return null;
  }

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'LOW_STOCK':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'IN':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'OUT':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'ADJUSTMENT':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={material.material_name} size="2xl">
      <div className="space-y-6 pt-2">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Package className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Current Quantity</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {material.current_quantity} {material.unit_of_measurement}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Minimum Stock Level</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {material.minimum_stock_level} {material.unit_of_measurement}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cost per Unit</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  ₹{material.cost_per_unit.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {material.category_name && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{material.category_name}</p>
                </div>
              </div>
            )}

            {material.supplier_name && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Supplier</p>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{material.supplier_name}</p>
                  {material.supplier_contact && (
                    <p className="text-xs text-gray-500">{material.supplier_contact}</p>
                  )}
                </div>
              </div>
            )}

            {material.storage_location && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Storage Location</p>
                  <p className="font-medium text-gray-800 dark:text-gray-100">{material.storage_location}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stock Status and Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Stock Status</h4>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStockStatusColor(material.stock_status)}`}>
              {material.stock_status.replace('_', ' ')}
            </span>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Total Value</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              ₹{material.total_value.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Description */}
        {material.description && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Description</h4>
            <p className="text-gray-600 dark:text-gray-300">{material.description}</p>
          </div>
        )}

        {/* Purchase Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {material.purchase_date && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Purchase Date</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {new Date(material.purchase_date).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
          )}

          {material.last_purchase_date && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Purchase</p>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {new Date(material.last_purchase_date).toLocaleDateString('en-GB')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="border rounded-lg">
          <div className="p-4 border-b">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <History className="w-5 h-5" />
              Recent Transactions
            </h4>
          </div>
          
          <div className="p-4">
            {loadingTransactions ? (
              <div className="text-center py-4 text-gray-500">Loading transactions...</div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type}
                      </span>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          {transaction.quantity > 0 ? '+' : ''}{transaction.quantity} {material.unit_of_measurement}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.transaction_date).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                    </div>
                    {transaction.total_cost && (
                      <div className="text-right">
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          ₹{transaction.total_cost.toLocaleString('en-IN')}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No transactions found</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MaterialViewModal;