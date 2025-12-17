import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/ui/Button';
import { useUser } from '@/context/UserContext'; // useUser ஐ சேர்க்கவும்
import toast from 'react-hot-toast'; // toast ஐ சேர்க்கவும்
import Input from '@/components/ui/Input'; // Input ஐ சேர்க்கவும்
import TextArea from '@/components/ui/TextArea'; // TextArea ஐ சேர்க்கவும்
import { Loader2 } from 'lucide-react'; // Loader2 ஐ சேர்க்கவும்

interface GalleryUploaderProps {
  onUploadSuccess?: () => void; // ✅ To refresh gallery after upload
}

const GalleryUploader: React.FC<GalleryUploaderProps> = ({ onUploadSuccess }) => {
  const { user, userProfile, loading: userLoading } = useUser(); // useUser hook ஐப் பயன்படுத்துதல்
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState(''); // NEW: தலைப்பு
  const [description, setDescription] = useState(''); // NEW: விளக்கம்
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!user || userLoading || !userProfile?.role) {
      toast.error('You must be logged in as an Owner or Manager to upload.');
      return;
    }
    // அங்கீகாரச் சரிபார்ப்பு: Owner அல்லது Manager ஆக இருக்க வேண்டும்
    if (userProfile.role !== 'owner' && userProfile.role !== 'manager') {
      toast.error('Permission Denied: Only Owners and Managers can upload images.');
      return;
    }

    if (!file || !category.trim()) {
      toast.error('Please select a file and enter a category.'); // toast ஐப் பயன்படுத்துதல்
      return;
    }

    setUploading(true);
    toast.loading('Uploading image...', { id: 'uploadToast' });

    const fileExt = file.name.split('.').pop();
    const safeCategory = category.toLowerCase().replace(/\s+/g, '_');
    const timestamp = Date.now();
    const fileName = `${safeCategory}_${timestamp}.${fileExt}`; // Supabase Storage இல் கோப்பின் பெயர்
    const filePath = `gallery/${fileName}`; // ஸ்டோரேஜில் உள்ள பாதை

    try {
      // படி 1: Supabase Storage க்கு படத்தைப் பதிவேற்றவும்
      const { error: uploadError } = await supabase.storage
        .from('gallery') // உங்கள் பக்கெட் பெயர்
        .upload(filePath, file, { // filePath ஐப் பயன்படுத்துதல்
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // படி 2: public.gallery_items அட்டவணையில் பட மெட்டாடேட்டாவைச் செருகவும்
      const { error: dbError } = await supabase.from('gallery_items').insert([
        {
          filename: filePath, // ஸ்டோரேஜில் உள்ள கோப்பின் பாதை
          category: category.trim(),
          title: title.trim() || null, // காலியாக இருந்தால் null
          description: description.trim() || null, // காலியாக இருந்தால் null
          uploaded_by: user.id, // உள்நுழைந்த பயனரின் ID
        },
      ]);

      if (dbError) {
        // ஸ்டோரேஜிலிருந்து படத்தை நீக்க முயற்சி செய்யுங்கள், ஏனெனில் DB செருகல் தோல்வியடைந்தது
        await supabase.storage.from('gallery').remove([filePath]);
        throw new Error(`Failed to save image metadata: ${dbError.message}`);
      }

      toast.success('Image uploaded successfully!', { id: 'uploadToast' });
      setFile(null);
      setCategory('');
      setTitle(''); // மீட்டமைக்கவும்
      setDescription(''); // மீட்டமைக்கவும்
      onUploadSuccess?.(); // கேலரியைப் புதுப்பிக்கவும்

    } catch (err: any) {
      console.error('❌ Upload process failed:', err);
      toast.error(`Upload failed: ${err.message}`, { id: 'uploadToast' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-zinc-800 rounded-md shadow border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white"> Upload Gallery Image</h3>

      {!(userProfile?.role === 'owner' || userProfile?.role === 'manager') && !userLoading ? (
        <p className="text-red-600 dark:text-red-400 text-sm">
          You do not have permission to upload images. Only Owners and Managers can upload.
        </p>
      ) : (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />

          <Input
            id="category"
            type="text"
            label="Category"
            placeholder="Enter category (e.g. Wedding, Packaging)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={uploading}
          />
          <Input
            id="title"
            type="text"
            label="Title (Optional)"
            placeholder="Enter image title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
          />
          <TextArea
            id="description"
            label="Description (Optional)"
            placeholder="Enter image description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
            rows={3}
          />

          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="animate-spin w-4 h-4 mr-2" /> Uploading...
              </>
            ) : (
              'Upload Image'
            )}
          </Button>
        </>
      )}
    </div>
  );
};

export default GalleryUploader;
