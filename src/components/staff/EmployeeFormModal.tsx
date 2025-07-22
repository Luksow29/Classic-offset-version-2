// src/components/staff/EmployeeFormModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { logActivity } from '@/lib/activityLogger';
import { useUser } from '@/context/UserContext';

// A_FIX: Changed to a more appropriate type name 'Employee'
interface Employee {
  id?: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  status: 'Active' | 'On Leave' | 'Terminated';
}

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  employee: Employee | null;
}

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ isOpen, onClose, onSave, employee }) => {
  const { userProfile } = useUser();
  const [formData, setFormData] = useState<Employee>({
    name: '',
    role: '',
    email: '',
    phone: '',
    status: 'Active',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (employee) {
      setFormData(employee);
    } else {
      setFormData({ name: '', role: '', email: '', phone: '', status: 'Active' });
    }
  }, [employee, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const upsertData = {
        name: formData.name,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
    };

    try {
        let response;
        if (formData.id) {
            // Update existing employee
            response = await supabase.from('employees').update(upsertData).eq('id', formData.id);
        } else {
            // Create new employee
            response = await supabase.from('employees').insert(upsertData);
        }

        if (response.error) throw response.error;

        toast.success(`Employee ${formData.id ? 'updated' : 'added'} successfully!`);

        // Log activity
        const userName = userProfile?.name || 'Admin';
        const activityMessage = formData.id
            ? `Updated details for employee "${upsertData.name}"`
            : `Added a new employee: "${upsertData.name}" with the role of ${upsertData.role}`;
        await logActivity(activityMessage, userName);

        onSave();
        onClose();

    } catch (error: any) {
        toast.error(`Failed to save employee: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };
  
  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'On Leave', label: 'On Leave' },
    { value: 'Terminated', label: 'Terminated' },
  ];


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={employee ? 'Edit Employee' : 'Add New Employee'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="name" label="Full Name" value={formData.name} onChange={handleChange} required />
        <Input id="role" label="Role" value={formData.role} onChange={handleChange} placeholder="e.g., Printer, Designer" required />
        <Input id="email" label="Email Address" type="email" value={formData.email} onChange={handleChange} />
        <Input id="phone" label="Phone Number" type="tel" value={formData.phone} onChange={handleChange} />
        <Select id="status" label="Status" value={formData.status} onChange={handleChange} options={statusOptions} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeFormModal;
