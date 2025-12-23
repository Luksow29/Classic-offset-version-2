import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Package, Tag, User, MapPin, Calendar, DollarSign, TrendingUp, History, PackageSearch, AlertTriangle } from 'lucide-react';
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={null} size="2xl">
      <div className="pt-1 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-3 border-b pb-4 dark:border-gray-700">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <PackageSearch className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{material.material_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${material.stock_status === 'IN_STOCK' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  material.stock_status === 'LOW_STOCK' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                {material.stock_status === 'LOW_STOCK' && <AlertTriangle className="w-3 h-3 mr-1" />}
                {material.stock_status.replace(/_/g, ' ')}
              </span>
              {material.category_name && <span className="text-sm text-gray-500">• {material.category_name}</span>}
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
            <div className="text-xs text-gray-500 mb-1">Current Stock</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{material.current_quantity} <span className="text-xs font-normal text-gray-500">{material.unit_of_measurement}</span></div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
            <div className="text-xs text-gray-500 mb-1">Total Value</div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">₹{material.total_value.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
            <div className="text-xs text-gray-500 mb-1">Unit Cost</div>
            <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">₹{material.cost_per_unit}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-400" /> Details
            </h3>
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 space-y-3">
              {material.description && (
                <div>
                  <span className="text-xs text-gray-500 block">Description</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{material.description}</span>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500 block">Min Stock Level</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{material.minimum_stock_level} {material.unit_of_measurement}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{material.storage_location || 'No location set'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /> Supplier Info
            </h3>
            <div className="bg-white dark:bg-gray-800 border rounded-lg p-4 space-y-3">
              <div>
                <span className="text-xs text-gray-500 block">Supplier Name</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{material.supplier_name || 'N/A'}</span>
              </div>
              {material.supplier_contact && (
                <div>
                  <span className="text-xs text-gray-500 block">Contact</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{material.supplier_contact}</span>
                </div>
              )}
              <div className="flex items-center gap-2 pt-1 border-t mt-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  Last Purchase: {material.last_purchase_date ? new Date(material.last_purchase_date).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="border rounded-lg overflow-hidden">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-600">
            <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <History className="w-4 h-4" />
              Recent Transactions (Last 5)
            </h4>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loadingTransactions ? (
              <div className="text-center py-6 text-gray-500 text-sm">Loading transactions...</div>
            ) : transactions.length > 0 ? (
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-xs text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left font-medium text-xs text-gray-500">Type</th>
                    <th className="px-4 py-2 text-right font-medium text-xs text-gray-500">Qty</th>
                    <th className="px-4 py-2 text-right font-medium text-xs text-gray-500">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.slice(0, 5).map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{new Date(t.transaction_date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold
                                     ${t.transaction_type === 'IN' ? 'bg-green-100 text-green-700' :
                            t.transaction_type === 'OUT' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                          }`}>
                          {t.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right font-medium">
                        <span className={t.transaction_type === 'OUT' ? 'text-red-600' : 'text-green-600'}>
                          {t.transaction_type === 'OUT' ? '-' : '+'}{t.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{t.total_cost ? `₹${t.total_cost}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">No recent transactions found</div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default MaterialViewModal;