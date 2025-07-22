import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/context/UserContext';

// public.employees இலிருந்து வரும் ஊழியர் வகைக்கு
interface Employee {
  id: string;
  name: string;
  job_role?: string; // employees டேபிளில் job_role இருக்கலாம்
}

// staff_logs இல் பதிவு செய்வதற்கான வகை
interface StaffLogData {
  id?: number; // திருத்தப்படும்போது id இருக்கும்
  date: string;
  employee_id: string; // user_id க்கு பதிலாக employee_id
  role: string; // ஊழியரின் வேலைப் பங்கு (Designer, Printer)
  time_in: string;
  time_out: string;
  work_done: string;
  notes?: string;
}

interface StaffLogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // தரவு மாறியதும் parent ஐ புதுப்பிக்க
  editingLog?: StaffLogData | null; // திருத்தப்படும் பதிவு
}

const StaffLogFormModal: React.FC<StaffLogFormModalProps> = ({ isOpen, onClose, onSave, editingLog }) => {
  const { userProfile } = useUser();
  const [formData, setFormData] = useState<StaffLogData>({
    date: new Date().toISOString().split('T')[0],
    employee_id: '', // user_id க்கு பதிலாக employee_id
    role: '',
    time_in: '',
    time_out: '',
    work_done: '',
    notes: '',
  });

  const [employees, setEmployees] = useState<Employee[]>([]); // ஊழியர் பட்டியலைச் சேமிக்க
  const [loadingEmployees, setLoadingEmployees] = useState(true); // ஊழியர் fetching க்கான loading state
  const [saving, setSaving] = useState(false);

  // ஊழியர்களைப் பெறவும் (public.employees இலிருந்து)
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      const { data, error } = await supabase
        .from('employees') // public.employees டேபிளிலிருந்து ஊழியர்களைப் பெறவும்
        .select('id, name, job_role'); // தேவையான களங்களை மட்டும் தேர்ந்தெடுக்கவும்
      
      if (error) {
        console.error('❌ Error fetching employees for form:', error.message);
        toast.error('Failed to load employees for form.');
      } else {
        setEmployees(data || []);
      }
      setLoadingEmployees(false);
    };
    fetchEmployees();
  }, []);

  // திருத்தும் பயன்முறைக்கு படிவத்தை நிரப்பவும்
  useEffect(() => {
    if (editingLog) {
      setFormData({
        id: editingLog.id,
        date: editingLog.date,
        employee_id: editingLog.employee_id,
        role: editingLog.role,
        time_in: editingLog.time_in,
        time_out: editingLog.time_out,
        work_done: editingLog.work_done,
        notes: editingLog.notes || '',
      });
    } else {
      // புதிய பதிவுக்கு மீட்டமைக்கவும்
      setFormData({
        date: new Date().toISOString().split('T')[0],
        employee_id: '',
        role: '',
        time_in: '',
        time_out: '',
        work_done: '',
        notes: '',
      });
    }
  }, [editingLog, isOpen]); // isOpen ஐ ஒரு dependency ஆகச் சேர்க்கவும்

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can manage staff logs.');
      return;
    }

    setSaving(true);
    toast.loading('Saving work log...', { id: 'saveLogToast' });

    try {
      const dataToSave = {
        date: formData.date,
        employee_id: formData.employee_id, // employee_id ஐப் பயன்படுத்துதல்
        role: formData.role,
        time_in: formData.time_in,
        time_out: formData.time_out,
        work_done: formData.work_done,
        notes: formData.notes || null,
      };

      if (editingLog) {
        const { error } = await supabase
          .from('staff_logs')
          .update(dataToSave)
          .eq('id', editingLog.id);
        if (error) throw error;
        toast.success('Work log updated successfully!', { id: 'saveLogToast' });
      } else {
        const { error } = await supabase.from('staff_logs').insert(dataToSave);
        if (error) throw error;
        toast.success('Work log added successfully!', { id: 'saveLogToast' });
      }

      onSave(); // parent கூறில் தரவைப் புதுப்பிக்க
      onClose(); // மோடலை மூடவும்
    } catch (err: any) {
      console.error('Failed to save work log:', err.message);
      toast.error(`Failed to save work log: ${err.message}`, { id: 'saveLogToast' });
    } finally {
      setSaving(false);
    }
  };

  const roleOptions = [ // இந்த ரோல்கள் staff_logs.role க்கானது, employees.job_role க்கு இது பொதுவானதாக இருக்கலாம்
    { value: '', label: 'Select Role' }, 
    { value: 'Printer', label: 'Printer' },
    { value: 'Designer', label: 'Designer' },
    { value: 'Manager', label: 'Manager' }, // இது Staff Log Role, app role Manager அல்ல
    { value: 'Sales', label: 'Sales' },
    { value: 'Customer Service', label: 'Customer Service' },
    { value: 'Delivery', label: 'Delivery' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingLog ? 'Edit Work Log' : 'Add New Work Log'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="date"
          label="Date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          required
          disabled={saving}
        />
        <Select
          id="employee_id" // user_id க்கு பதிலாக employee_id ஐப் பயன்படுத்துதல்
          label="Staff Name"
          options={employees.map(employee => ({ value: employee.id, label: employee.name }))}
          value={formData.employee_id}
          onChange={handleChange}
          required
          disabled={saving || loadingEmployees}
          placeholder={loadingEmployees ? "Loading staff..." : "Select staff member"}
        />
        <Select
          id="role"
          label="Role"
          options={roleOptions}
          value={formData.role}
          onChange={handleChange}
          required
          disabled={saving}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="time_in"
            label="Time In"
            type="time"
            value={formData.time_in}
            onChange={handleChange}
            required
            disabled={saving}
          />
          <Input
            id="time_out"
            label="Time Out"
            type="time"
            value={formData.time_out}
            onChange={handleChange}
            required
            disabled={saving}
          />
        </div>
        <TextArea
          id="work_done"
          label="Work Description"
          value={formData.work_done}
          onChange={handleChange}
          rows={3}
          required
          disabled={saving}
        />
        <TextArea
          id="notes"
          label="Notes (Optional)"
          value={formData.notes}
          onChange={handleChange}
          rows={2}
          disabled={saving}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 mr-2" /> Saving...
              </>
            ) : (
              editingLog ? 'Update Log' : 'Add Log'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StaffLogFormModal;
