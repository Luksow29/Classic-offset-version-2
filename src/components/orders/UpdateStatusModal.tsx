// src/components/orders/UpdateStatusModal.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { db } from '@/lib/firebaseClient';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from '@/lib/activityLogger';
import { useUser } from '@/context/UserContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Loader2, CheckCircle, Pencil, Printer, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from './OrdersTable';

interface Props {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated: () => void;
}

const statusOptions: { name: 'Pending' | 'Design' | 'Printing' | 'Delivered', icon: React.ElementType }[] = [
    { name: 'Pending', icon: Pencil },
    { name: 'Design', icon: Printer },
    { name: 'Printing', icon: Truck },
    { name: 'Delivered', icon: CheckCircle },
];

const UpdateStatusModal: React.FC<Props> = ({ order, isOpen, onClose, onStatusUpdated }) => {
  const [newStatus, setNewStatus] = useState(order.status);
  const [loading, setLoading] = useState(false);
  const { userProfile } = useUser();

  const handleUpdate = async () => {
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
      toast.error("Failed to create live notification.");
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
        <p className="text-sm text-gray-600 dark:text-gray-400">Select the new status for this order. This will notify relevant parties.</p>
        <div className="grid grid-cols-2 gap-4">
            {statusOptions.map(({name, icon: Icon}) => (
                <button 
                    key={name} 
                    onClick={() => setNewStatus(name)}
                    className={`relative p-4 text-left rounded-lg border-2 transition-all transform hover:scale-105 ${
                        newStatus === name ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50 shadow-lg' : 'border-gray-200 dark:border-gray-600 hover:border-primary-400'
                    }`}
                >
                    {newStatus === name && <CheckCircle className="w-5 h-5 text-primary-500 absolute top-2 right-2"/>}
                    <div className="flex items-center gap-3">
                        <Icon className={`w-6 h-6 ${newStatus === name ? 'text-primary-600' : 'text-gray-500'}`} />
                        <p className={`font-semibold ${newStatus === name ? 'text-primary-700 dark:text-primary-200' : 'text-gray-800 dark:text-gray-100'}`}>{name}</p>
                    </div>
                </button>
            ))}
        </div>
        <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={loading || newStatus === order.status}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                Update Status
            </Button>
        </div>
      </div>
    </Modal>
  );
};

export default UpdateStatusModal;