import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';

interface Employee {
  id?: string; // திருத்தப்படும்போது ID இருக்கும்
  name: string;
  job_role: string;
  contact_phone?: string;
  contact_email?: string;
  is_active: boolean;
  app_user_id?: string; // அப்ளிகேஷன் பயனருடன் இணைக்க
}

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // தரவு மாறியதும் parent ஐ புதுப்பிக்க
  editingEmployee?: Employee | null; // திருத்தப்படும் ஊழியர்
}

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ isOpen, onClose, onSave, editingEmployee }) => {
  const { userProfile } = useUser();
  const [formData, setFormData] = useState<Employee>({
    name: '',
    job_role: '',
    contact_phone: '',
    contact_email: '',
    is_active: true,
    app_user_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [availableAppUsers, setAvailableAppUsers] = useState<any[]>([]); // அப்ளிகேஷன் பயனர்களின் பட்டியல்

  useEffect(() => {
    // அப்ளிகேஷன் பயனர்களைப் பெறவும் (app_user_id ஐ இணைக்க)
    const fetchAppUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email'); // பயனரின் பெயர் மற்றும் ID ஐப் பெறவும்
      
      if (error) {
        console.error('Error fetching app users:', error.message);
      } else {
        // ஏற்கனவே ஒரு app_user_id கொண்ட employees ஐ வடிகட்டவும்
        const { data: existingEmployeeUsers } = await supabase
            .from('employees')
            .select('app_user_id')
            .not('app_user_id', 'is', null);

        const existingUserIds = existingEmployeeUsers?.map(e => e.app_user_id) || [];
        
        // ஏற்கனவே எந்த employee க்கும் link செய்யப்படாத users ஐ மட்டும் காண்பி
        setAvailableAppUsers(data?.filter(u => !existingUserIds.includes(u.id)) || []);
      }
    };
    fetchAppUsers();
  }, [editingEmployee]); // editingEmployee மாறும்போது புதுப்பிக்கவும்

  useEffect(() => {
    // திருத்தும் பயன்முறைக்கு படிவத்தை நிரப்பவும்
    if (editingEmployee) {
      setFormData({
        id: editingEmployee.id,
        name: editingEmployee.name,
        job_role: editingEmployee.job_role,
        contact_phone: editingEmployee.contact_phone || '',
        contact_email: editingEmployee.contact_email || '',
        is_active: editingEmployee.is_active,
        app_user_id: editingEmployee.app_user_id || '',
      });
    } else {
      // புதிய பதிவுக்கு மீட்டமைக்கவும்
      setFormData({
        name: '',
        job_role: '',
        contact_phone: '',
        contact_email: '',
        is_active: true,
        app_user_id: '',
      });
    }
  }, [editingEmployee, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can manage employees.');
      return;
    }

    setSaving(true);
    toast.loading('Saving employee...', { id: 'saveEmployeeToast' });

    try {
      const dataToSave = {
        name: formData.name.trim(),
        job_role: formData.job_role.trim() || null,
        contact_phone: formData.contact_phone?.trim() || null,
        contact_email: formData.contact_email?.trim() || null,
        is_active: formData.is_active,
        app_user_id: formData.app_user_id || null, // app_user_id ஐ சேமிக்கவும்
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(dataToSave)
          .eq('id', editingEmployee.id);
        if (error) throw error;
        toast.success('Employee updated successfully!', { id: 'saveEmployeeToast' });
      } else {
        const { error } = await supabase.from('employees').insert(dataToSave);
        if (error) throw error;
        toast.success('Employee added successfully!', { id: 'saveEmployeeToast' });
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Failed to save employee:', err.message);
      toast.error(`Failed to save employee: ${err.message}`, { id: 'saveEmployeeToast' });
    } finally {
      setSaving(false);
    }
  };

  const jobRoleOptions = [
    { value: '', label: 'Select Job Role' },
    { value: 'Printer', label: 'Printer' },
    { value: 'Designer', label: 'Designer' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Customer Service', label: 'Customer Service' },
    { value: 'Delivery', label: 'Delivery' },
    { value: 'Manager', label: 'Manager (Employee Role)' }, // Job role, not app role
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingEmployee ? 'Edit Employee' : 'Add New Employee'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="name"
          label="Employee Name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={saving}
        />
        <Select
          id="job_role"
          label="Job Role"
          options={jobRoleOptions}
          value={formData.job_role}
          onChange={handleChange}
          required
          disabled={saving}
          placeholder="Select a job role"
        />
        <Input
          id="contact_phone"
          label="Contact Phone (Optional)"
          type="tel"
          value={formData.contact_phone}
          onChange={handleChange}
          disabled={saving}
        />
        <Input
          id="contact_email"
          label="Contact Email (Optional)"
          type="email"
          value={formData.contact_email}
          onChange={handleChange}
          disabled={saving}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500"
            disabled={saving}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Is Active
          </label>
        </div>
        {/* App User ID இணைப்பு (இருக்கும் பயனர்களுக்கு மட்டும்) */}
        {/* புதிய ஊழியர்களைச் சேர்க்கும்போது, அவர்களுக்கு ஆப் யூசர் அக்கவுண்ட் link செய்ய வாய்ப்பளிக்கவும் */}
        {/* எடிட்டிங் பயன்முறையில், app_user_id ஏற்கனவே இருந்தால், அதை மாற்ற முடியாது அல்லது அது disable செய்யப்பட்டிருக்க வேண்டும் */}
        <Select
          id="app_user_id"
          label="Link to App User (Optional)"
          options={availableAppUsers.map(user => ({ value: user.id, label: `${user.name} (${user.email})` }))}
          value={formData.app_user_id || ''}
          onChange={handleChange}
          disabled={saving || (!!editingEmployee?.app_user_id && !formData.app_user_id)} // ஏற்கனவே link செய்யப்பட்டிருந்தால் disable
          placeholder="Select an app user"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EmployeeFormModal;
