import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Template } from './TemplateManager'; // TemplateManager-லிருந்து வகையைப் பெறவும்
import { Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingTemplate: Template | null;
}

const TemplateFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, editingTemplate }) => {
  const [formData, setFormData] = useState({ name: '', category: 'General', body: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name,
        category: editingTemplate.category,
        body: editingTemplate.body,
      });
    } else {
      // புதிய டெம்ப்ளேட்டிற்கு படிவத்தை மீட்டமைக்கவும்
      setFormData({ name: '', category: 'General', body: '' });
    }
  }, [editingTemplate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.body) {
      toast.error('Template Name and Message Body are required.');
      return;
    }
    setLoading(true);
    
    try {
        if (editingTemplate) {
            // திருத்தும் முறை
            const { error } = await supabase.from('whatsapp_templates').update(formData).eq('id', editingTemplate.id);
            if (error) throw error;
            toast.success('Template updated successfully!');
        } else {
            // ✅ புதியது சேர்க்கும் முன், பெயர் ஏற்கெனவே உள்ளதா என சரிபார்க்கவும்
            const { data: existingTemplate, error: checkError } = await supabase
                .from('whatsapp_templates')
                .select('name')
                .eq('name', formData.name)
                .maybeSingle();

            if (checkError) throw checkError;

            if (existingTemplate) {
                throw new Error('A template with this name already exists.');
            }

            // புதிய டெம்ப்ளேட்டைச் சேர்க்கவும்
            const { error } = await supabase.from('whatsapp_templates').insert([formData]);
            if (error) throw error;
            toast.success('New template created successfully!');
        }
        onSave();
        onClose();

    } catch (err: any) {
        toast.error(err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTemplate ? 'Edit Template' : 'Create New Template'}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input 
            id="name" 
            label="Template Name *" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
            disabled={loading}
        />
        <Select 
            id="category" 
            label="Category" 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})} 
            options={[
                {value: 'Order', label: 'Order'}, 
                {value: 'Payment', label: 'Payment'},
                {value: 'General', label: 'General'}
            ]}
            disabled={loading} 
        />
        <TextArea 
            id="body" 
            label="Message Body *" 
            value={formData.body} 
            onChange={(e) => setFormData({...formData, body: e.target.value})} 
            rows={5} 
            placeholder="Use {{customer_name}} for variables." 
            required 
            disabled={loading}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" variant="primary" loading={loading} disabled={loading}>
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TemplateFormModal;