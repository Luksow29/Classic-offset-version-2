import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Loader2, AlertTriangle, Edit, Trash2, ImageOff, Plus, Link as LinkIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import ConfirmationModal from '../ui/ConfirmationModal';
import GalleryItemFormModal from './GalleryItemFormModal'; // GalleryItemFormModal ஐ இறக்குமதி செய்யவும்

interface GalleryItem {
  id: string;
  filename: string;
  category: string;
  title: string | null;
  description: string | null;
  uploaded_at: string;
  publicUrl?: string; // இது Client-side இல் சேர்க்கப்படும்
}

interface GalleryItemsTableProps {
  onDataChange: () => void;
  onEditItem: (item: GalleryItem) => void;
}

const GalleryItemsTable: React.FC<GalleryItemsTableProps> = ({ onDataChange, onEditItem }) => {
  const { userProfile } = useUser();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchGalleryItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('gallery_items')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (fetchError) throw fetchError;

      const itemsWithUrls = (data || []).map(item => {
        const { data: publicUrlData } = supabase.storage
          .from('gallery')
          .getPublicUrl(item.filename);

        return {
          ...item,
          publicUrl: publicUrlData.publicUrl,
        };
      });
      setGalleryItems(itemsWithUrls);
    } catch (err: any) {
      console.error('Failed to fetch gallery items:', err.message);
      setError(`Failed to load gallery items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGalleryItems();
  }, [fetchGalleryItems, onDataChange]); // onDataChange ஐயும் சேர்க்கவும்

  const handleEdit = (item: GalleryItem) => {
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can edit gallery items.');
      return;
    }
    onEditItem(item);
  };

  const handleDelete = (item: GalleryItem) => {
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can delete gallery items.');
      return;
    }
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setLoading(true); // தற்காலிகமாக loading ஐ அமைக்கவும்
    try {
      // படி 1: Supabase Storage இலிருந்து கோப்பை நீக்கவும்
      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([itemToDelete.filename]); // filename ஐப் பயன்படுத்துதல்

      if (storageError) throw storageError;

      // படி 2: டேட்டாபேஸிலிருந்து பதிவை நீக்கவும்
      const { error: dbError } = await supabase
        .from('gallery_items')
        .delete()
        .eq('id', itemToDelete.id);

      if (dbError) {
        // DB நீக்குதல் தோல்வியடைந்தால் ஒருவேளை Storage இல் இருந்து நீக்கியதை மீண்டும் சேர்க்கலாம்
        // ஆனால் பொதுவாக இந்த கட்டத்தில் Storage நீக்குதல் வெற்றிகரமாக நடந்திருக்கும்
        throw dbError;
      }

      toast.success('Gallery item deleted successfully!');
      onDataChange(); // parent ஐ புதுப்பிக்க
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete gallery item:', err.message);
      toast.error(`Failed to delete gallery item: ${err.message}`);
    } finally {
      // setLoading(false); // fetchGalleryItems ஆல் கையாளப்படுகிறது
    }
  };

  if (loading && galleryItems.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading gallery items...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500" />
        <p className="font-semibold">Error Loading Gallery Items</p>
        <p className="text-sm">{error}</p>
      </Card>
    );
  }

  return (
    <Card title="Manage Gallery Items">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Image</th>
              <th className="px-4 py-3 text-left font-medium">Title / Category</th>
              <th className="px-4 py-3 text-left font-medium">Description</th>
              <th className="px-4 py-3 text-left font-medium">Uploaded At</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {galleryItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No gallery items found. Upload new images above.
                </td>
              </tr>
            ) : (
              galleryItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    {item.publicUrl ? (
                      <img src={item.publicUrl} alt={item.title || item.category} className="w-16 h-16 object-cover rounded-md" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-md">
                        <ImageOff className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    <div>{item.title || '-'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.category}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs truncate">{item.description || '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(item.uploaded_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} title="Edit Metadata">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item)} title="Delete Image">
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                    {item.publicUrl && (
                      <Button variant="ghost" size="sm" onClick={() => window.open(item.publicUrl, '_blank')} title="View Original Image">
                        <LinkIcon size={16} />
                      </Button>
                    )}
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
        title="Delete Gallery Item"
        description={`Are you sure you want to delete "${itemToDelete?.title || itemToDelete?.filename}"? This will permanently remove the image from storage and its record from the database.`}
        confirmText="Delete Permanently"
      />
      {/* Edit Modal */}
      {showEditModal && (
        <GalleryItemFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={onDataChange}
          editingItem={editingItem}
        />
      )}
    </Card>
  );
};

export default GalleryItemsTable;