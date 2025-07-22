// @ts-nocheck
// src/components/orders/EditOrderModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { Loader2, AlertCircle, User, Phone, Package, Calendar, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { Order } from './OrdersTable';

interface EditOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderUpdated: () => void;
}

interface EditableOrderData {
  customer_name: string;
  customer_phone: string;
  order_type: string;
  quantity: number;
  delivery_date: string;
  notes: string;
  designer_id: string | null;
  design_needed: boolean;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ isOpen, onClose, order, onOrderUpdated }) => {
  const [formData, setFormData] = useState<EditableOrderData>({
    customer_name: '', customer_phone: '', order_type: '', quantity: 1, 
    delivery_date: '', notes: '', designer_id: null, design_needed: false,
  });
  const [designers, setDesigners] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      fetchOrderDetails();
    }
    const fetchDesigners = async () => {
        const { data } = await supabase.from('employees').select('id, name').eq('job_role', 'Designer').eq('is_active', true);
        setDesigners(data || []);
    };
    fetchDesigners();
  }, [isOpen, order]);

  const fetchOrderDetails = async () => {
    // ... (Your existing fetch logic is fine)
    if (!order) return; setLoading(true);
    try {
      const { data, error: fetchError } = await supabase.from('orders').select('*').eq('id', order.order_id).single();
      if (fetchError) throw fetchError;
      setFormData({
        customer_name: data.customer_name || '', customer_phone: data.customer_phone || '',
        order_type: data.order_type || '', quantity: data.quantity || 1,
        delivery_date: data.delivery_date || '', notes: data.notes || '',
        designer_id: data.designer_id || null, design_needed: data.design_needed || false,
      });
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    // ... (Your existing change handler is fine)
    const { id, value, type } = e.target;
    setFormData(prev => ({ ...prev, [id]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? parseInt(value) || 0 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // ... (Your existing submit logic is fine)
    e.preventDefault(); if (!order) return;
    setLoading(true); setError(null);
    const { error: updateError } = await supabase.from('orders').update({
        customer_name: formData.customer_name, customer_phone: formData.customer_phone,
        order_type: formData.order_type, quantity: formData.quantity,
        delivery_date: formData.delivery_date, notes: formData.notes,
        designer_id: formData.designer_id, design_needed: formData.design_needed,
        updated_at: new Date().toISOString(),
      }).eq('id', order.order_id);
    
    if (updateError) {
        toast.error(`Update failed: ${updateError.message}`);
        setError(updateError.message);
    } else {
        toast.success('Order updated successfully!');
        onOrderUpdated();
        onClose();
    }
    setLoading(false);
  };

  if (!isOpen || !order) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Order #${order.order_id}`} size="2xl">
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {error && <div className="... error styling ...">{error}</div>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Input icon={<User size={16}/>} id="customer_name" label="Customer Name *" value={formData.customer_name} onChange={handleChange} required disabled={loading} />
           <Input icon={<Phone size={16}/>} id="customer_phone" label="Customer Phone" type="tel" value={formData.customer_phone} onChange={handleChange} disabled={loading} />
        </div>
        <div className="p-4 border-t border-b dark:border-gray-700 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select icon={<Package size={16}/>} id="order_type" label="Order Type *" value={formData.order_type} onChange={handleChange} options={[{ value: 'Business Cards', label: 'Business Cards' }, { value: 'Invitation Cards', label: 'Invitation Cards' }, { value: 'Posters', label: 'Posters' }]} required disabled={loading}/>
                <Input id="quantity" label="Quantity *" type="number" min="1" value={formData.quantity} onChange={handleChange} required disabled={loading}/>
             </div>
             <Input icon={<Calendar size={16}/>} id="delivery_date" label="Delivery Date *" type="date" value={formData.delivery_date} onChange={handleChange} required disabled={loading}/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <input type="checkbox" id="design_needed" checked={formData.design_needed} onChange={handleChange} disabled={loading} className="... checkbox styling ..."/>
                <label htmlFor="design_needed" className="font-medium">Design Service Needed?</label>
            </div>
            {formData.design_needed && <Select icon={<Palette size={16}/>} id="designer_id" label="Assign Designer" value={formData.designer_id || ''} onChange={handleChange} options={designers.map(d => ({ value: d.id, label: d.name }))} disabled={loading || !formData.design_needed} placeholder="Select Designer"/>}
        </div>
        <TextArea id="notes" label="Notes" value={formData.notes} onChange={handleChange} disabled={loading} rows={3}/>
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={loading}>{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Order'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditOrderModal;
