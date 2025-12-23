// src/components/orders/UpdateStatusModal.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { db } from '@/lib/firebaseClient';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from '@/lib/activityLogger';
import { useUser } from '@/context/UserContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Loader2, CheckCircle, Pencil, Printer, Truck, FileWarning, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { OrdersTableOrder } from '@/types';
import { sendOrderUpdateNotification } from '@/lib/customerNotifications';
import { hasAnyStaffRole } from '@/lib/rbac';

interface Props {
  order: OrdersTableOrder;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const statusOptions: { name: 'Pending' | 'Design' | 'Correction' | 'Printing' | 'Delivered', icon: React.ElementType, description: string }[] = [
  { name: 'Pending', icon: Pencil, description: 'Order received, waiting for action' },
  { name: 'Design', icon: Printer, description: 'Currently in design phase' },
  { name: 'Correction', icon: FileWarning, description: 'Changes requested/Draft in review' },
  { name: 'Printing', icon: Truck, description: 'Sent to production/printing' },
  { name: 'Delivered', icon: CheckCircle, description: 'Order completed and delivered' },
];

const UpdateStatusModal: React.FC<Props> = ({ order, isOpen, onClose, onStatusUpdated }) => {
  const [newStatus, setNewStatus] = useState(order.status);
  const [loading, setLoading] = useState(false);
  const { userProfile } = useUser();
  const canUpdateStatus = hasAnyStaffRole(userProfile?.role, ['owner', 'manager', 'office', 'designer', 'production']);

  const handleUpdate = async () => {
    if (!canUpdateStatus) {
      toast.error('Permission denied: you do not have access to update order status.');
      return;
    }
    setLoading(true);
    const userName = userProfile?.name || 'Admin';

    const { error: supabaseError } = await supabase.from('order_status_log').insert({
      order_id: order.order_id,
      status: newStatus,
      updated_by: userName,
    });

    if (supabaseError) {
      toast.error(`Failed to update status: ${supabaseError.message}`);
      setLoading(false);
      return;
    }

    toast.success(`Status updated to "${newStatus}"!`);

    // Send notification to customer portal (Supabase)
    try {
      const { data: orderData } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('id', order.order_id)
        .single();

      if (orderData?.customer_id) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('user_id')
          .eq('id', orderData.customer_id)
          .single();

        if (customerData?.user_id) {
          await sendOrderUpdateNotification(
            customerData.user_id,
            order.order_id,
            newStatus,
            `Your order #${order.order_id} status has been updated to "${newStatus}".`
          );
        }
      }
    } catch (notifError) {
      console.error('[UpdateStatusModal] Error sending customer notification:', notifError);
    }

    // Send notification to admin panel (Firebase)
    try {
      await addDoc(collection(db, "notifications"), {
        orderId: order.order_id,
        customerName: order.customer_name,
        newStatus: newStatus,
        message: `Order #${order.order_id} for ${order.customer_name} has been updated to "${newStatus}".`,
        timestamp: serverTimestamp(),
        read: false,
        updatedBy: userName,
      });
    } catch (firestoreError) {
      console.error("Error adding notification to Firestore:", firestoreError);
    }

    const activityMessage = `Updated status of Order #${order.order_id} to "${newStatus}"`;
    await logActivity(activityMessage, userName);

    onStatusUpdated();
    setLoading(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Update Status for Order #${order.order_id}`}>
      <div className="space-y-4 pt-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">Select the new status for this order. This will notify relevant parties.</p>
        {!canUpdateStatus && (
          <div className="p-3 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            Permission denied: you don’t have access to update order status.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {statusOptions.map(({ name, icon: Icon, description }) => (
            <button
              key={name}
              onClick={() => setNewStatus(name)}
              disabled={!canUpdateStatus || loading}
              className={`relative p-4 text-left rounded-xl border-2 transition-all duration-200 ${newStatus === name
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary'
                  : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
            >
              {newStatus === name && (
                <div className="absolute top-3 right-3 text-primary animate-in fade-in zoom-in duration-300">
                  <CheckCircle size={18} fill="currentColor" className="text-white dark:text-gray-900" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${newStatus === name ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className={`font-bold text-sm ${newStatus === name ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>{name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={loading || !canUpdateStatus || newStatus === order.status}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Update Status
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UpdateStatusModal;
