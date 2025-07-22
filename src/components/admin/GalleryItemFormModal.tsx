// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import { Loader2 } from 'lucide-react';

interface GalleryItem {
  id: string;
  filename: string; // File name in storage, useful for display/delete
  category: string;
  title: string | null;
  description: string | null;
  uploaded_at: string;
  publicUrl?: string; // For display in modal
}

interface GalleryItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // தரவு மாறியதும் parent ஐ புதுப்பிக்க
  editingItem?: GalleryItem | null; // திருத்தப்படும் உருப்படி, புதியதாக இருந்தால் null
}

const GalleryItemFormModal: React.FC<GalleryItemFormModalProps> = ({ isOpen, onClose, onSave, editingItem }) => {
  const { userProfile } = useUser();
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  // வகைகளின் பட்டியலை நிர்வகிக்க
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);

  useEffect(() => {
    // படிவம் திறக்கும்போது அல்லது திருத்தப்படும் உருப்படி மாறும்போது படிவத்தை நிரப்பவும்
    if (editingItem) {
      setFormData({
        category: editingItem.category || '',
        title: editingItem.title || '',
        description: editingItem.description || '',
      });
    } else {
      // புதிய உருப்படிக்கு படிவத்தை மீட்டமைக்கவும்
      setFormData({
        category: '',
        title: '',
        description: '',
      });
    }

    // இருக்கும் வகைகளைப் பெறவும்
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('category', { distinct: true });

      if (error) {
        console.error('Error fetching categories for form:', error.message);
      } else {
        const categories = data?.map(item => item.category).filter(Boolean) as string[];
        setAvailableCategories(categories.sort());
      }
    };
    fetchCategories();
  }, [editingItem, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can edit gallery items.');
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        category: formData.category.trim(),
        title: formData.title.trim() || null,
        description: formData.description.trim() || null,
      };

      if (editingItem) {
        // உருப்படியைப் புதுப்பிக்கவும்
        const { error } = await supabase
          .from('gallery_items')
          .update(dataToSave)
          .eq('id', editingItem.id);
        if (error) throw error;
        toast.success('Gallery item updated successfully!');
      } else {
        // இந்த மோடல் புதிய உருப்படிகளைச் சேர்க்கப் பயன்படாது,
        // GalleryUploader மட்டுமே புதிய உருப்படிகளைச் சேர்க்கும்
        throw new Error("This modal is for editing existing items only.");
      }

      onSave(); // parent கூறில் தரவைப் புதுப்பிக்க
      onClose(); // மோடலை மூடவும்
    } catch (err: any) {
      console.error('Failed to save gallery item:', err.message);
      toast.error(`Failed to save gallery item: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = availableCategories.map(cat => ({ value: cat, label: cat }));
  // ஒரு புதிய வகையை உள்ளிடுவதற்கான "other" விருப்பத்தைச் சேர்க்கவும்
  if (!categoryOptions.some(opt => opt.value === formData.category) && formData.category) {
    categoryOptions.push({ value: formData.category, label: `${formData.category} (new)` });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingItem ? 'Edit Gallery Item' : 'Add New Gallery Item (Error)'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {editingItem?.publicUrl && ( // படத்தைக் காண்பிக்கவும்
          <div className="mb-4 text-center">
            <img src={editingItem.publicUrl} alt={editingItem.title || 'Gallery Image'} className="max-h-48 mx-auto rounded-md object-cover" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Current image</p>
          </div>
        )}
        <Select
          id="category"
          label="Category"
          value={formData.category}
          onChange={handleChange}
          options={categoryOptions}
          placeholder="Select or type a category"
          required
          disabled={loading}
        />
        <Input
          id="title"
          label="Title"
          value={formData.title}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <TextArea
          id="description"
          label="Description (Optional)"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          disabled={loading}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default GalleryItemFormModal;
