import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface StaffLogFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingLog: any;
}

const StaffLogFormModal: React.FC<StaffLogFormModalProps> = ({ isOpen, onClose, onSave, editingLog }) => {
    const [formData, setFormData] = useState({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        role: '',
        time_in: '09:00',
        time_out: '17:00',
        work_done: '',
        notes: ''
    });
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchEmployees();
        }
        if (editingLog) {
            setFormData({
                employee_id: editingLog.employee_id || '',
                date: editingLog.date ? editingLog.date.split('T')[0] : new Date().toISOString().split('T')[0],
                role: editingLog.role || '',
                time_in: editingLog.time_in || '09:00',
                time_out: editingLog.time_out || '17:00',
                work_done: editingLog.work_done || '',
                notes: editingLog.notes || ''
            });
        } else {
            setFormData({
                employee_id: '',
                date: new Date().toISOString().split('T')[0],
                role: '',
                time_in: '09:00',
                time_out: '17:00',
                work_done: '',
                notes: ''
            });
        }
    }, [isOpen, editingLog]);

    const fetchEmployees = async () => {
        try {
            const { data } = await supabase.from('employees').select('id, name');
            setEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData };
            if (editingLog?.id) {
                const { error } = await supabase.from('staff_logs').update(payload).eq('id', editingLog.id);
                if (error) throw error;
                toast.success('Log updated');
            } else {
                const { error } = await supabase.from('staff_logs').insert([payload]);
                if (error) throw error;
                toast.success('Log added');
            }
            onSave();
            onClose();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save log');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingLog ? 'Edit Work Log' : 'Add Work Log'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Select
                    id="employee_id"
                    label="Employee"
                    value={formData.employee_id}
                    onChange={handleChange}
                    options={[
                        { value: '', label: 'Select Employee' },
                        ...employees.map(e => ({ value: e.id, label: e.name }))
                    ]}
                    required
                />
                <Input id="date" type="date" label="Date" value={formData.date} onChange={handleChange} required />
                <Input id="role" label="Role" value={formData.role} onChange={handleChange} required />
                <div className="grid grid-cols-2 gap-4">
                    <Input id="time_in" type="time" label="Time In" value={formData.time_in} onChange={handleChange} required />
                    <Input id="time_out" type="time" label="Time Out" value={formData.time_out} onChange={handleChange} required />
                </div>
                <TextArea id="work_done" label="Work Description" value={formData.work_done} onChange={handleChange} required />
                <TextArea id="notes" label="Notes" value={formData.notes} onChange={handleChange} />

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
                    <Button variant="primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
                </div>
            </form>
        </Modal>
    );
};
export default StaffLogFormModal;
