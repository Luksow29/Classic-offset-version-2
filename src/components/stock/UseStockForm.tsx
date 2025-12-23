import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import { Loader2, PackageMinus, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { useUser } from '@/context/UserContext';
import { logActivity } from '@/lib/activityLogger';
import toast from 'react-hot-toast';

interface StockItem {
  id: string;
  item_name: string;
  balance: number;
  unit_of_measurement: string;
  minimum_stock_level: number;
  source: 'existing_stock' | 'materials';
  category?: string;
  supplier_name?: string;
  storage_location?: string;
}

const UseStockForm: React.FC = () => {
  const { userProfile } = useUser();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [selectedSource,] = useState<'existing_stock' | 'materials' | 'all'>('all');
  const [stockId, setStockId] = useState('');
  const [usedQuantity, setUsedQuantity] = useState('');
  const [usedFor, setUsedFor] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingItems, setFetchingItems] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  const fetchStockList = async () => {
    setFetchingItems(true);
    try {
      const stockPromises = [];

      if (selectedSource === 'all' || selectedSource === 'existing_stock') {
        stockPromises.push(
          supabase
            .from('stock')
            .select('id, item_name, quantity_in, quantity_used, category, minimum_stock_level')
            .then(({ data, error }) => {
              if (error) throw error;
              return (data || []).map((item) => ({
                id: `existing_${item.id}`,
                item_name: `${item.item_name} (Existing Stock)`,
                balance: (item.quantity_in || 0) - (item.quantity_used || 0),
                unit_of_measurement: 'pieces',
                minimum_stock_level: item.minimum_stock_level || 0,
                source: 'existing_stock' as const,
                category: item.category,
                storage_location: 'Existing Stock'
              }));
            })
        );
      }

      if (selectedSource === 'all' || selectedSource === 'materials') {
        stockPromises.push(
          supabase
            .from('materials_with_details')
            .select('id, material_name, current_quantity, unit_of_measurement, category_name, supplier_name, storage_location, minimum_stock_level')
            .then(({ data, error }) => {
              if (error) throw error;
              return (data || []).map((item) => ({
                id: `material_${item.id}`,
                item_name: `${item.material_name} (Materials)`,
                balance: item.current_quantity || 0,
                unit_of_measurement: item.unit_of_measurement || 'pieces',
                minimum_stock_level: item.minimum_stock_level || 0,
                source: 'materials' as const,
                category: item.category_name,
                supplier_name: item.supplier_name,
                storage_location: item.storage_location
              }));
            })
        );
      }

      const results = await Promise.all(stockPromises);
      const combinedItems = results.flat().filter(item => item.balance > 0);
      combinedItems.sort((a, b) => a.item_name.localeCompare(b.item_name));
      setStockItems(combinedItems);
    } catch (error) {
      console.error('Error fetching stock list:', error);
      setMessage({ type: 'error', text: 'Failed to load stock items. Please try again.' });
    } finally {
      setFetchingItems(false);
    }
  };

  useEffect(() => {
    fetchStockList();
  }, [selectedSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const selected = stockItems.find((s) => s.id === stockId);
    if (!selected) {
      setMessage({ type: 'error', text: 'Please select a valid stock item.' });
      setLoading(false);
      return;
    }

    const usedQty = Number(usedQuantity);
    if (usedQty <= 0 || isNaN(usedQty)) {
      setMessage({ type: 'error', text: 'Quantity must be a positive number.' });
      setLoading(false);
      return;
    }

    if (usedQty > selected.balance) {
      setMessage({ type: 'error', text: 'Cannot use more than available balance.' });
      setLoading(false);
      return;
    }

    try {
      const userName = userProfile?.name || 'Admin';

      if (selected.source === 'existing_stock') {
        const originalId = selected.id.replace('existing_', '');
        await supabase.from('stock_usage_log').insert([{ stock_id: parseInt(originalId), used_quantity: usedQty, used_for: usedFor, notes: notes || null }]);
        await supabase.rpc('increment_quantity_used', { stock_id_input: parseInt(originalId), additional_used: usedQty });
      } else {
        const materialId = selected.id.replace('material_', '');
        await supabase.from('material_transactions').insert([{ material_id: materialId, transaction_type: 'OUT', quantity: usedQty, notes: `Used for: ${usedFor}${notes ? ` | Notes: ${notes}` : ''}` }]);
      }

      const activityMessage = `Used ${usedQty} ${selected.unit_of_measurement} of "${selected.item_name}" for ${usedFor}.`;
      await logActivity(activityMessage, userName);

      // Check for low stock and create notification
      const newBalance = selected.balance - usedQty;
      if (newBalance <= selected.minimum_stock_level) {
        // Prevent duplicate notifications within a short time frame (e.g., 1 day)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const q = query(
          collection(db, "notifications"),
          where("type", "==", "low_stock"),
          where("relatedId", "==", selected.id),
          where("timestamp", ">", oneDayAgo)
        );

        const existingNotifs = await getDocs(q);

        if (existingNotifs.empty) {
          const notifMessage = `Stock for "${selected.item_name}" is low (${newBalance} ${selected.unit_of_measurement} remaining).`;
          await addDoc(collection(db, "notifications"), {
            message: notifMessage,
            type: 'low_stock',
            relatedId: selected.id,
            timestamp: serverTimestamp(),
            read: false,
            triggeredBy: 'System',
          });
          toast.success('Low stock alert created');
        }
      }

      setMessage({ type: 'success', text: 'Stock usage recorded successfully!' });
      setStockId('');
      setUsedQuantity('');
      setUsedFor('');
      setNotes('');
      fetchStockList();

      setTimeout(() => setMessage(null), 3000);

    } catch (error: any) {
      console.error('Error recording stock usage:', error);
      setMessage({ type: 'error', text: `Failed to record usage: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = stockItems.find(item => item.id === stockId);

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <PackageMinus className="w-5 h-5 text-primary" />
          Record Stock Usage
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Item *</label>
            {fetchingItems ? (
              <div className="flex items-center justify-center py-3 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <Loader2 className="w-4 h-4 animate-spin mr-2 text-primary" />
                <span className="text-sm text-gray-500">Loading items...</span>
              </div>
            ) : (
              <select
                value={stockId}
                onChange={(e) => setStockId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              >
                <option value="">-- Select Item --</option>
                {stockItems.map((stock) => (
                  <option key={stock.id} value={stock.id}>
                    {stock.item_name} | Available: {stock.balance} {stock.unit_of_measurement}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedItem && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Selected: {selectedItem.item_name}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                Available Balance: {selectedItem.balance} {selectedItem.unit_of_measurement}
              </p>
              {selectedItem.storage_location && (
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Location: {selectedItem.storage_location}
                </p>
              )}
            </div>
          )}

          <Input label="Quantity Used *" name="used_quantity" type="number" step="0.01" min="0.01" value={usedQuantity} onChange={(e) => setUsedQuantity(e.target.value)} required placeholder="0" />
          <Input label="Used For *" name="used_for" placeholder="e.g., Order #123, Internal usage" value={usedFor} onChange={(e) => setUsedFor(e.target.value)} required />
          <TextArea id="notes" label="Additional Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional details..." />

          <Button type="submit" disabled={loading || fetchingItems || !stockId} className="w-full">
            {loading ? 'Recording...' : 'Record Usage'}
          </Button>

          {message && (
            <div className={`p-3 rounded-md flex items-center gap-2 text-sm ${message.type === 'success'
                ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </form>
      </div>
    </Card>
  );
};

export default UseStockForm;
