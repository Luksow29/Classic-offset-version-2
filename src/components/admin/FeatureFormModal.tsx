// src/components/admin/FeatureFormModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

// Manually curated list of common/useful Lucide icons to avoid importing the entire library.
// This helps in reducing the bundle size significantly.
const iconNames = [
  'Activity', 'Airplay', 'AlarmClock', 'AlertTriangle', 'Award', 'BadgeCheck',
  'Banknote', 'BarChart', 'Bell', 'Bike', 'Book', 'Bookmark', 'Briefcase',
  'Building', 'Bus', 'Calculator', 'Calendar', 'Camera', 'Car', 'CheckCircle',
  'Clipboard', 'Clock', 'Cloud', 'Code', 'Coffee', 'Compass', 'Copy', 'CreditCard',
  'Crown', 'Database', 'DollarSign', 'Download', 'Droplet', 'Edit', 'ExternalLink',
  'Eye', 'Facebook', 'FastForward', 'Feather', 'File', 'Film', 'Filter', 'Flag',
  'Folder', 'Gift', 'GitBranch', 'Github', 'Globe', 'Grid', 'HardDrive', 'Hash',
  'Headphones', 'Heart', 'HelpCircle', 'Home', 'Image', 'Inbox', 'Info', 'Instagram',
  'Key', 'Laptop', 'Layers', 'Layout', 'Link', 'Linkedin', 'List', 'Loader',
  'Lock', 'LogIn', 'LogOut', 'Mail', 'Map', 'MapPin', 'Maximize', 'Menu', 'MessageCircle',
  'Mic', 'Minimize', 'Monitor', 'Moon', 'MoreHorizontal', 'Move', 'Music', 'Package',
  'Paperclip', 'Pause', 'Percent', 'Phone', 'PieChart', 'Play', 'Plus', 'Power',
  'Printer', 'Radio', 'RefreshCw', 'Repeat', 'Rewind', 'Rocket', 'Save', 'Scissors',
  'Search', 'Send', 'Server', 'Settings', 'Share2', 'Shield', 'ShoppingBag',
  'ShoppingCart', 'Sidebar', 'Signal', 'Slack', 'Smartphone', 'Smile', 'Speaker',
  'Star', 'Sun', 'Sunrise', 'Sunset', 'Table', 'Tag', 'Target', 'Terminal', 'ThumbsDown',
  'ThumbsUp', 'ToggleLeft', 'ToggleRight', 'Tool', 'Trash2', 'TrendingDown',
  'TrendingUp', 'Truck', 'Twitch', 'Twitter', 'Type', 'Umbrella', 'Unlock',
  'Upload', 'User', 'UserCheck', 'UserPlus', 'Users', 'Video', 'Voicemail', 'Volume2',
  'Watch', 'Wifi', 'Wind', 'X', 'Youtube', 'Zap'
].sort();


interface Feature {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  order_index: number;
  is_active: boolean;
}

interface FeatureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingFeature?: Feature | null;
}

const FeatureFormModal: React.FC<FeatureFormModalProps> = ({ isOpen, onClose, onSave, editingFeature }) => {
  const { userProfile } = useUser();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon_name: '',
    order_index: 0,
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingFeature) {
      setFormData({
        title: editingFeature.title,
        description: editingFeature.description,
        icon_name: editingFeature.icon_name,
        order_index: editingFeature.order_index,
        is_active: editingFeature.is_active,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        icon_name: '',
        order_index: 0,
        is_active: true,
      });
    }
  }, [editingFeature, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || (userProfile.role !== 'owner' && userProfile.role !== 'manager')) {
      toast.error('Permission denied: Only Owners and Managers can manage features.');
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        icon_name: formData.icon_name.trim(),
        order_index: Number(formData.order_index),
        is_active: formData.is_active,
      };

      if (editingFeature) {
        const { error } = await supabase
          .from('features')
          .update(dataToSave)
          .eq('id', editingFeature.id);
        if (error) throw error;
        toast.success('Feature updated successfully!');
      } else {
        const { error } = await supabase.from('features').insert(dataToSave);
        if (error) throw error;
        toast.success('Feature added successfully!');
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Failed to save feature:', err.message);
      toast.error(`Failed to save feature: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingFeature ? 'Edit Feature' : 'Add New Feature'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
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
          label="Description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          disabled={loading}
        />
        <Select
          id="icon_name"
          label="Icon Name (Lucide Icons)"
          value={formData.icon_name}
          onChange={handleChange}
          options={iconNames.map(icon => ({ value: icon, label: icon }))}
          placeholder="Select an icon"
          required
          disabled={loading}
        />
        <Input
          id="order_index"
          label="Order Index"
          type="number"
          value={formData.order_index}
          onChange={handleChange}
          min="0"
          disabled={loading}
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500"
            disabled={loading}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Is Active (Show on Website)
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Save Feature'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FeatureFormModal;
