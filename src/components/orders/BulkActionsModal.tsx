// src/components/orders/BulkActionsModal.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Loader2, CheckSquare, Trash2, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from './OrdersTable';

interface BulkActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedOrders: Order[];
  onBulkActionComplete: () => void;
}

const BulkActionsModal: React.FC<BulkActionsModalProps> = ({ isOpen, onClose, selectedOrders, onBulkActionComplete }) => {
  const [action, setAction] = useState<'status' | 'delete' | ''>('');
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBulkAction = async () => {
    // ... (Your existing bulk action logic is perfect, no changes needed)
    if (!action || selectedOrders.length === 0) return;
    setLoading(true);
    const orderIds = selectedOrders.map(order => order.order_id);
    try {
      if (action === 'status' && newStatus) {
        const updates = orderIds.map(id => supabase.from('order_status_log').insert({ order_id: id, status: newStatus, updated_by: 'Bulk Action'}));
        await Promise.all(updates);
        toast.success(`Successfully updated status for ${orderIds.length} orders.`);
      } else if (action === 'delete') {
        await supabase.from('orders').update({ is_deleted: true, deleted_at: new Date().toISOString() }).in('id', orderIds);
        const logDeletes = orderIds.map(id => supabase.from('order_status_log').insert({ order_id: id, status: 'Cancelled', updated_by: 'Bulk Action', notes: 'Bulk archived'}));
        await Promise.all(logDeletes);
        toast.success(`Successfully archived ${orderIds.length} orders.`);
      }
      onBulkActionComplete();
      onClose();
    } catch (err: any) {
      toast.error(`Bulk action failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Order Actions" size="lg">
      <div className="space-y-6 pt-2">
        <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg text-center">
          <p className="font-semibold text-primary-800 dark:text-primary-200">{selectedOrders.length} Orders Selected</p>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">Choose an action to apply to all selected orders:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={() => setAction('status')} className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center text-center ${action === 'status' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50' : 'border-gray-300 dark:border-gray-600'}`}>
              <Edit className="w-8 h-8 mb-2 text-primary-600" />
              <p className="font-semibold">Update Status</p>
            </div>
             <div onClick={() => setAction('delete')} className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center text-center ${action === 'delete' ? 'border-red-500 bg-red-50 dark:bg-red-900/50' : 'border-gray-300 dark:border-gray-600'}`}>
              <Trash2 className="w-8 h-8 mb-2 text-red-600" />
              <p className="font-semibold">Archive Orders</p>
            </div>
          </div>
        </div>

        {action === 'status' && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg animate-slide-up">
            <Select
              id="newStatus"
              label="Select New Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              options={[{ value: 'Pending', label: 'Pending' }, { value: 'Design', label: 'Design' }, { value: 'Printing', label: 'Printing' }, { value: 'Delivered', label: 'Delivered' }]}
              required
              placeholder="Select new status"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={action === 'delete' ? 'destructive' : 'primary'} onClick={handleBulkAction} disabled={loading || !action || (action === 'status' && !newStatus)}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Apply Action`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkActionsModal;