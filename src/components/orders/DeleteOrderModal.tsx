// src/components/orders/DeleteOrderModal.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { AlertTriangle, Loader2, Archive, Trash2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from './OrdersTable';

interface DeleteOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderDeleted: () => void;
}

const DeleteOrderModal: React.FC<DeleteOrderModalProps> = ({ isOpen, onClose, order, onOrderDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');

  const handleDelete = async () => {
    // ... (Your existing delete logic is perfect, no changes needed)
    if (!order) return;
    setLoading(true);
    try {
      if (deleteType === 'soft') {
        await supabase.from('orders').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', order.order_id);
        await supabase.from('order_status_log').insert({ order_id: order.order_id, status: 'Cancelled', updated_by: 'System', notes: 'Order soft deleted'});
        toast.success('Order archived successfully!');
      } else {
        await supabase.from('payments').delete().eq('order_id', order.order_id);
        await supabase.from('order_status_log').delete().eq('order_id', order.order_id);
        await supabase.from('orders').delete().eq('id', order.order_id);
        toast.success('Order permanently deleted!');
      }
      onOrderDeleted();
      onClose();
    } catch (err: any) {
        toast.error(`Delete failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion" size="lg">
      <div className="space-y-6 pt-2">
        <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500" />
            <h3 className="text-xl font-bold mt-2">Delete Order #{order.order_id}?</h3>
            <p className="text-sm text-gray-500">This action requires careful consideration.</p>
        </div>

        <div className="space-y-3">
          <div onClick={() => setDeleteType('soft')} className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-start gap-4 ${deleteType === 'soft' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50' : 'border-gray-300 dark:border-gray-600'}`}>
            <Archive className="w-8 h-8 text-primary-600 mt-1" />
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-100">Archive (Soft Delete)</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">Hides the order from the main list but keeps it for records. This is reversible and recommended.</p>
            </div>
          </div>
          <div onClick={() => setDeleteType('hard')} className={`p-4 border-2 rounded-lg cursor-pointer transition-all flex items-start gap-4 ${deleteType === 'hard' ? 'border-red-500 bg-red-50 dark:bg-red-900/50' : 'border-gray-300 dark:border-gray-600'}`}>
             <Trash2 className="w-8 h-8 text-red-600 mt-1" />
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-200">Delete Permanently</h4>
              <p className="text-xs text-red-700 dark:text-red-300">Removes the order and all associated data forever. This action cannot be undone.</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Yes, ${deleteType === 'soft' ? 'Archive' : 'Delete Permanently'}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteOrderModal;