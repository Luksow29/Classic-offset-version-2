import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import Select from '../ui/Select'; // தேவைப்படாது, ஆனால் மற்ற உள்ளீடுகளுக்கு இருக்கலாம்
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import { Loader2, Star } from 'lucide-react'; // Star ஐகானைச் சேர்க்கவும்

interface Testimonial {
  id: string;
  client_name: string;
  message: string;
  rating: number | null;
  is_approved: boolean;
}

interface TestimonialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // தரவு மாறியதும் parent ஐ புதுப்பிக்க
  editingTestimonial?: Testimonial | null; // திருத்தப்படும் கருத்து, புதியதாக இருந்தால் null
}

const TestimonialFormModal: React.FC<TestimonialFormModalProps> = ({ isOpen, onClose, onSave, editingTestimonial }) => {
  const { userProfile } = useUser();
  const [formData, setFormData] = useState({
    client_name: '',
    message: '',
    rating: 0, // NEW: 0 முதல் 5 வரை உள்ள எண்ணாக அமைக்கவும்
    is_approved: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingTestimonial) {
      setFormData({
        client_name: editingTestimonial.client_name,
        message: editingTestimonial.message,
        rating: editingTestimonial.rating || 0, // null ஆக இருந்தால் 0 ஆக மாற்று
        is_approved: editingTestimonial.is_approved,
      });
    } else {
      setFormData({
        client_name: '',
        message: '',
        rating: 0,
        is_approved: false,
      });
    }
  }, [editingTestimonial, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can manage testimonials.');
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        client_name: formData.client_name.trim(),
        message: formData.message.trim(),
        rating: formData.rating > 0 ? formData.rating : null, // 0 ஆக இருந்தால் null ஆக சேமிக்கவும்
        is_approved: formData.is_approved,
      };

      if (editingTestimonial) {
        const { error } = await supabase
          .from('testimonials')
          .update(dataToSave)
          .eq('id', editingTestimonial.id);
        if (error) throw error;
        toast.success('Testimonial updated successfully!');
      } else {
        const { error } = await supabase.from('testimonials').insert(dataToSave);
        if (error) throw error;
        toast.success('Testimonial added successfully!');
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Failed to save testimonial:', err.message);
      toast.error(`Failed to save testimonial: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // NEW: Star Rating UI components
  const renderStarRating = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((starValue) => (
          <Star
            key={starValue}
            size={24}
            className={`cursor-pointer ${formData.rating >= starValue ? 'text-yellow-500 fill-current' : 'text-gray-400'}`}
            onClick={() => setFormData(prev => ({ ...prev, rating: starValue }))}
          />
        ))}
        {formData.rating > 0 && ( // மதிப்பீடு இருந்தால் Clear பட்டனைக் காட்டவும்
          <Button type="button" variant="ghost" size="sm" onClick={() => setFormData(prev => ({ ...prev, rating: 0 }))} className="ml-2">
            Clear Rating
          </Button>
        )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="client_name"
          label="Client Name"
          value={formData.client_name}
          onChange={handleChange}
          required
          disabled={loading}
        />
        <TextArea
          id="message"
          label="Message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          required
          disabled={loading}
        />
        {/* NEW: Star Rating Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rating (Optional)
          </label>
          {renderStarRating()}
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_approved"
            checked={formData.is_approved}
            onChange={handleChange}
            className="rounded border-gray-300 text-primary-600 shadow-sm focus:ring-primary-500"
            disabled={loading}
          />
          <label htmlFor="is_approved" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Approved (Show on Website)
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Testimonial'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TestimonialFormModal;