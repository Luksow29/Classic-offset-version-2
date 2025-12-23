// @ts-nocheck
// src/components/customers/CustomerForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Input from '../ui/Input';
import Button from '../ui/Button';
import TextArea from '../ui/TextArea';
import { Loader2, AlertCircle, User, Phone, MapPin, Tag, Briefcase, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import CustomerTagging from './enhancements/CustomerTagging';
import { logActivity } from '@/lib/activityLogger';
import { db } from '@/lib/firebaseClient';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { hasAnyStaffRole } from '@/lib/rbac';
import { Customer } from '@/types';
import { motion } from 'framer-motion';

interface CustomerFormProps {
  selectedCustomer: Customer | null;
  onSave: (customer?: Customer) => void;
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
        joined_date: selectedCustomer.joined_date ? new Date(selectedCustomer.joined_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        secondary_phone: selectedCustomer.secondary_phone || '',
        company_name: selectedCustomer.company_name || '',
        billing_address: selectedCustomer.billing_address || '',
        shipping_address: selectedCustomer.shipping_address || '',
        birthday: selectedCustomer.birthday || '',
        tags: selectedCustomer.tags || [],
      });
    } else {
      // Reset form
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

    if (!userProfile || !hasAnyStaffRole(userProfile.role, ['owner', 'manager', 'office'])) {
      toast.error('Permission denied: You do not have access to add/edit customers.');
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
        try {
          await addDoc(collection(db, "notifications"), {
            message: `New customer "${payload.name}" has been added.`,
            type: 'customer_created',
            relatedId: customerId,
            timestamp: serverTimestamp(),
            read: false,
            triggeredBy: userName,
          });
        } catch (notifyError) {
          console.error('Notification error:', notifyError);
          // Non-blocking
        }
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

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 pb-2 mb-4 border-b border-gray-100 dark:border-gray-700">
      <Icon className="w-4 h-4 text-primary" />
      <h4 className="font-semibold text-gray-700 dark:text-gray-200 text-sm uppercase tracking-wider">{title}</h4>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Basic Info Section */}
      <section>
        <SectionHeader icon={User} title="Basic Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input id="name" label="Customer Name *" value={formData.name} onChange={handleChange} required disabled={loading} placeholder="e.g. John Doe" />
          <Input id="company_name" label="Company Name" value={formData.company_name} onChange={handleChange} disabled={loading} placeholder="e.g. Acme Corp" />
          <Input id="birthday" label="Birthday" type="date" value={formData.birthday} onChange={handleChange} disabled={loading} />
          <Input id="joined_date" label="Joined Date" type="date" value={formData.joined_date} onChange={handleChange} required disabled={loading} />
        </div>
      </section>

      {/* Contact Section */}
      <section>
        <SectionHeader icon={Phone} title="Contact Details" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input id="phone" label="Primary Phone *" type="tel" value={formData.phone} onChange={handleChange} required disabled={loading} placeholder="+91 98765 43210" />
          <Input id="secondary_phone" label="Secondary Phone" type="tel" value={formData.secondary_phone} onChange={handleChange} disabled={loading} placeholder="Alternate number" />
          <div className="md:col-span-2">
            <Input id="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} disabled={loading} placeholder="john@example.com" />
          </div>
        </div>
      </section>

      {/* Address Section */}
      <section>
        <SectionHeader icon={MapPin} title="Addresses" />
        <div className="space-y-4">
          <TextArea id="address" label="Primary Address" value={formData.address} onChange={handleChange} rows={2} disabled={loading} placeholder="Street, City, State, Zip" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextArea id="billing_address" label="Billing Address" value={formData.billing_address} onChange={handleChange} rows={2} disabled={loading} placeholder="If different from primary" />
            <TextArea id="shipping_address" label="Shipping Address" value={formData.shipping_address} onChange={handleChange} rows={2} disabled={loading} placeholder="If different from primary" />
          </div>
        </div>
      </section>

      {/* Tags Section */}
      <section>
        <SectionHeader icon={Tag} title="Categorization" />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Customer Tags</label>
          <CustomerTagging initialTags={formData.tags} onTagsChange={handleTagsChange} />
          <p className="text-xs text-gray-500 mt-1">Add tags like 'VIP', 'Wholesale', 'Late Payer' to organize customers.</p>
        </div>
      </section>

      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="w-24">
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading} className="min-w-[140px]">
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            <span>{selectedCustomer ? 'Update Customer' : 'Add Customer'}</span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default CustomerForm;
