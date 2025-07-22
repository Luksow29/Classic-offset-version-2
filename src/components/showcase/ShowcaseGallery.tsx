import React, { useEffect, useState, useCallback } from 'react'; // useCallback ஐச் சேர்க்கவும்
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ImageOff, ZoomIn, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'; // Pagination ஐகான்களைச் சேர்க்கவும்
import Modal from '../ui/Modal';
import Select from '../ui/Select'; // Select Component ஐச் சேர்க்கவும்
import Button from '../ui/Button'; // Button Component ஐச் சேர்க்கவும்

interface GalleryItem {
  id: string;
  filename: string;
  category: string;
  title: string | null;
  description: string | null;
  uploaded_at: string;
  publicUrl: string;
}

interface ShowcaseGalleryProps {
  refreshKey: number;
}

const ITEMS_PER_PAGE = 8; // ஒரு பக்கத்திற்கு காட்ட வேண்டிய படங்களின் எண்ணிக்கை

const ShowcaseGallery: React.FC<ShowcaseGalleryProps> = ({ refreshKey }) => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filtering and Sorting states
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortField, setSortField] = useState('uploaded_at');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [availableCategories, setAvailableCategories] = useState<string[]>([]); // வடிகட்டுதலுக்கான வகைகளின் பட்டியல்

  const fetchGalleryItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('gallery_items').select('*', { count: 'exact' }); // total count ஐப் பெறவும்

      // Filtering
      if (filterCategory !== 'All') {
        query = query.eq('category', filterCategory);
      }

      // Sorting
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      // Pagination
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      // பட URL களை உருவாக்குங்கள்
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
      setTotalItems(count || 0); // மொத்த எண்ணிக்கையை அமைக்கவும்

    } catch (err: any) {
      console.error('❌ Error fetching gallery items:', err.message);
      setError(`Failed to load gallery images: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterCategory, sortField, sortOrder]); // dependencies

  // வகைகளைப் பெறவும்
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('category');

      if (error) {
        console.error('Error fetching categories:', error.message);
      } else {
        const categories = data?.map(item => item.category).filter(Boolean) as string[];
        setAvailableCategories(['All', ...new Set(categories)].sort()); // தனிப்பட்ட மற்றும் வரிசைப்படுத்தப்பட்ட வகைகளைப் பெறவும்
      }
    };
    fetchCategories();
  }, []); // ஒரு முறை மட்டுமே இயக்கவும்

  useEffect(() => {
    fetchGalleryItems();
  }, [fetchGalleryItems, refreshKey]); // refreshKey அல்லது pagination/filter/sort மாறும்போது மீண்டும் பெறவும்

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <span className="ml-2 text-gray-500 dark:text-gray-400">Loading gallery...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        <span>{error}</span>
      </div>
    );
  }

  if (galleryItems.length === 0 && totalItems === 0) { // totalItems 0 ஆக இருந்தால், டேட்டாபேஸில் படங்கள் இல்லை
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <ImageOff className="w-12 h-12 mb-4" />
        <p className="text-lg font-semibold">No images in the gallery yet.</p>
        <p className="text-sm">Upload your first print creation above!</p>
      </div>
    );
  }

  return (
    <>
      {/* Filtering and Sorting Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Select
          id="category-filter"
          label="Filter by Category"
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }} // வடிகட்டும்போது முதல் பக்கத்திற்குச் செல்லவும்
          options={availableCategories.map(cat => ({ value: cat, label: cat }))}
          placeholder="All Categories"
        />
        <Select
          id="sort-by"
          label="Sort By"
          value={sortField}
          onChange={(e) => { setSortField(e.target.value); setCurrentPage(1); }}
          options={[
            { value: 'uploaded_at', label: 'Upload Date' },
            { value: 'title', label: 'Title' },
            { value: 'category', label: 'Category' },
          ]}
        />
        <Select
          id="sort-order"
          label="Order"
          value={sortOrder}
          onChange={(e) => { setSortOrder(e.target.value); setCurrentPage(1); }}
          options={[
            { value: 'desc', label: 'Descending' },
            { value: 'asc', label: 'Ascending' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {galleryItems.map((item) => (
          <div
            key={item.id}
            className="relative rounded-lg overflow-hidden shadow-lg transition-transform transform hover:scale-105 duration-300 group cursor-pointer"
            onClick={() => setSelectedImage(item)}
          >
            <img
              src={item.publicUrl}
              alt={item.title || item.category || 'Gallery Image'}
              className="w-full h-64 object-cover"
            />
            {/* Overlay for title/description on hover */}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-white">
                <h4 className="font-semibold text-lg">{item.title || item.category}</h4>
                {item.description && <p className="text-xs line-clamp-2">{item.description}</p>}
              </div>
              <ZoomIn className="absolute top-2 right-2 text-white opacity-70 group-hover:opacity-100" size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <Button onClick={handlePrevPage} disabled={currentPage === 1} variant="outline" size="sm">
            <ChevronLeft size={16} /> Previous
          </Button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <Button onClick={handleNextPage} disabled={currentPage === totalPages} variant="outline" size="sm">
            Next <ChevronRight size={16} />
          </Button>
        </div>
      )}


      {/* Image Modal */}
      {selectedImage && (
        <Modal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          title={selectedImage.title || selectedImage.category || 'Gallery Image'}
          size="lg"
        >
          <div className="flex flex-col items-center space-y-4">
            <img src={selectedImage.publicUrl} alt={selectedImage.title || 'Gallery Image'} className="max-w-full h-auto rounded-lg" />
            {selectedImage.description && (
              <p className="text-sm text-gray-700 dark:text-gray-300 text-center">
                {selectedImage.description}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Category: {selectedImage.category} | Uploaded on: {new Date(selectedImage.uploaded_at).toLocaleDateString()}
            </p>
          </div>
        </Modal>
      )}
    </>
  );
};

export default ShowcaseGallery;