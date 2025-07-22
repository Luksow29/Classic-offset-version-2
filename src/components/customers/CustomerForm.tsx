// @ts-nocheck
// src/components/customers/CustomerForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Input from '../ui/Input';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import { Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import CustomerTagging from './enhancements/CustomerTagging';
import { logActivity } from '@/lib/activityLogger';
import { db } from '@/lib/firebaseClient';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Define the shape of the customer object
interface Customer {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  joined_date?: string;
  secondary_phone?: string;
  company_name?: string;
  billing_address?: string;
  shipping_address?: string;
  birthday?: string;
  tags?: string[];
}

interface CustomerFormProps {
  selectedCustomer: Customer | null;
  onSave: () => void;
  onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ selectedCustomer, onSave, onCancel }) => {
  const { userProfile } = useUser();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    joined_date: new Date().toISOString().split('T')[0],
    secondary_phone: '',
    company_name: '',
    billing_address: '',
    shipping_address: '',
    birthday: '',
    tags: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCustomer) {
      setFormData({
        name: selectedCustomer.name || '',
        phone: selectedCustomer.phone || '',
        email: selectedCustomer.email || '',
        address: selectedCustomer.address || '',
        joined_date: selectedCustomer.joined_date || new Date().toISOString().split('T')[0],
        secondary_phone: selectedCustomer.secondary_phone || '',
        company_name: selectedCustomer.company_name || '',
        billing_address: selectedCustomer.billing_address || '',
        shipping_address: selectedCustomer.shipping_address || '',
        birthday: selectedCustomer.birthday || '',
        tags: selectedCustomer.tags || [],
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        joined_date: new Date().toISOString().split('T')[0],
        secondary_phone: '',
        company_name: '',
        billing_address: '',
        shipping_address: '',
        birthday: '',
        tags: [],
      });
    }
    setError(null);
  }, [selectedCustomer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleTagsChange = (newTags: string[]) => {
    setFormData({ ...formData, tags: newTags });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can add/edit customers.');
      return;
    }

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Name and phone number are required.');
      return;
    }

    setLoading(true);

    const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email?.trim() || null,
        address: formData.address?.trim() || null,
        joined_date: formData.joined_date,
        secondary_phone: formData.secondary_phone?.trim() || null,
        company_name: formData.company_name?.trim() || null,
        billing_address: formData.billing_address?.trim() || null,
        shipping_address: formData.shipping_address?.trim() || null,
        birthday: formData.birthday || null,
        tags: formData.tags,
    };

    try {
      let customerId;
      if (selectedCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', selectedCustomer.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('customers').insert(payload).select().single();
        if (error || !data) throw error || new Error("Failed to create customer.");
        customerId = data.id;
      }

      toast.success(`✅ Customer ${selectedCustomer ? 'updated' : 'added'} successfully!`);

      const userName = userProfile?.name || 'Admin';
      const activityMessage = selectedCustomer
        ? `Updated details for customer "${payload.name}"`
        : `Added a new customer: "${payload.name}"`;
      await logActivity(activityMessage, userName);

      // Create notification only for new customers
      if (!selectedCustomer && customerId) {
        await addDoc(collection(db, "notifications"), {
            message: `New customer "${payload.name}" has been added.`,
            type: 'customer_created',
            relatedId: customerId,
            timestamp: serverTimestamp(),
            read: false,
            triggeredBy: userName,
        });
      }

      onSave();
    } catch (err: any) {
      console.error('Error saving customer:', err);
      setError(err.message || 'An unexpected error occurred.');
      toast.error(`❌ Failed to save customer: ${err.message || 'An unexpected error occurred.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}
      <Input id="name" label="Customer Name *" value={formData.name} onChange={handleChange} required disabled={loading} />
      <Input id="phone" label="Phone Number *" type="tel" value={formData.phone} onChange={handleChange} required disabled={loading} />
      <Input id="secondary_phone" label="Secondary Phone" type="tel" value={formData.secondary_phone} onChange={handleChange} disabled={loading} />
      <Input id="email" label="Email" type="email" value={formData.email} onChange={handleChange} disabled={loading} />
      <Input id="company_name" label="Company Name" value={formData.company_name} onChange={handleChange} disabled={loading} />
      <TextArea id="address" label="Address" value={formData.address} onChange={handleChange} rows={3} disabled={loading} />
      <TextArea id="billing_address" label="Billing Address" value={formData.billing_address} onChange={handleChange} rows={3} disabled={loading} />
      <TextArea id="shipping_address" label="Shipping Address" value={formData.shipping_address} onChange={handleChange} rows={3} disabled={loading} />
      <Input id="birthday" label="Birthday" type="date" value={formData.birthday} onChange={handleChange} disabled={loading} />
      <Input id="joined_date" label="Joined Date" type="date" value={formData.joined_date} onChange={handleChange} required disabled={loading} />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
        <CustomerTagging initialTags={formData.tags} onTagsChange={handleTagsChange} />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (selectedCustomer ? 'Update Customer' : 'Add Customer')}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;
