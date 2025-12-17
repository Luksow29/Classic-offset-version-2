import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Loader2, AlertTriangle, Edit, Trash2, Check, X, Star, EyeOff, Eye } from 'lucide-react'; // ஐகான்களைச் சேர்க்கவும்
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import ConfirmationModal from '../ui/ConfirmationModal';

interface Testimonial {
  id: string;
  client_name: string;
  message: string;
  rating: number | null;
  is_approved: boolean;
  created_at: string;
}

interface TestimonialsTableProps {
  onEditTestimonial: (testimonial: Testimonial) => void; // எடிட் செய்ய கருத்தை அனுப்ப
  onDataChange: () => void; // தரவு மாறியதும் parent ஐ புதுப்பிக்க
}

const TestimonialsTable: React.FC<TestimonialsTableProps> = ({ onEditTestimonial, onDataChange }) => {
  const { userProfile } = useUser();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false }); // சமீபத்தியவை முதலில்

      if (fetchError) throw fetchError;
      setTestimonials(data || []);
    } catch (err: any) {
      console.error('Failed to fetch testimonials:', err.message);
      setError(`Failed to load testimonials: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials, onDataChange]);

  const handleDelete = (testimonial: Testimonial) => {
    if (!userProfile || (userProfile.role !== 'owner' && userProfile.role !== 'manager')) {
      toast.error('Permission denied: Only Owners and Managers can delete testimonials.');
      return;
    }
    setTestimonialToDelete(testimonial);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!testimonialToDelete) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', testimonialToDelete.id);

      if (error) throw error;
      toast.success('Testimonial deleted successfully!');
      onDataChange();
      setShowDeleteModal(false);
      setTestimonialToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete testimonial:', err.message);
      toast.error(`Failed to delete testimonial: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (testimonial: Testimonial) => {
    if (!userProfile || (userProfile.role !== 'owner' && userProfile.role !== 'manager')) {
      toast.error('Permission denied: Only Owners and Managers can toggle testimonial approval.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_approved: !testimonial.is_approved })
        .eq('id', testimonial.id);

      if (error) throw error;
      toast.success(`Testimonial ${!testimonial.is_approved ? 'approved' : 'unapproved'}!`);
      onDataChange();
    } catch (err: any) {
      console.error('Failed to toggle testimonial approval:', err.message);
      toast.error(`Failed to toggle approval: ${err.message}`);
    } finally {
      // setLoading(false); // fetchTestimonials ஆல் கையாளப்படுகிறது
    }
  };

  if (loading && testimonials.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading testimonials...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500" />
        <p className="font-semibold">Error Loading Testimonials</p>
        <p className="text-sm">{error}</p>
      </Card>
    );
  }

  return (
    <Card title="Manage Client Testimonials">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end">
        <Button onClick={() => onEditTestimonial(null)} variant="primary" size="sm">
          Add New Testimonial
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Client Name</th>
              <th className="px-4 py-3 text-left font-medium">Message</th>
              <th className="px-4 py-3 text-center font-medium">Rating</th>
              <th className="px-4 py-3 text-center font-medium">Approved</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {testimonials.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No testimonials found. Click "Add New Testimonial" to add one.
                </td>
              </tr>
            ) : (
              testimonials.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.client_name}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs truncate">{t.message}</td>
                  <td className="px-4 py-3 text-center">
                    {t.rating ? (
                      <span className="flex items-center justify-center">
                        {Array(t.rating).fill(0).map((_, i) => (
                          <Star key={i} size={14} className="text-yellow-500 fill-current" />
                        ))}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {t.is_approved ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => onEditTestimonial(t)} title="Edit Testimonial">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleApproval(t)} title="Toggle Approval">
                      {t.is_approved ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(t)} title="Delete Testimonial">
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Testimonial"
        description={`Are you sure you want to delete this testimonial from "${testimonialToDelete?.client_name}"? This action cannot be undone.`}
        confirmText="Delete Testimonial"
      />
    </Card>
  );
};

export default TestimonialsTable;
