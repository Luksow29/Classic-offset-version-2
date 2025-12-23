import React, { useMemo } from 'react';
import Modal from '../ui/Modal';
import { Product } from './types';
import { Tag, DollarSign, AlignLeft, Package } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ProductViewModal: React.FC<ProductViewModalProps> = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) {
    return null;
  }

  const imageUrl = useMemo(() => {
    if (!product.image_url) return null;
    if (product.image_url.startsWith('http')) return product.image_url;
    return supabase.storage.from('product_images').getPublicUrl(product.image_url).data.publicUrl;
  }, [product.image_url]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product.name} size="lg">
      <div className="space-y-4 pt-4">
        <div className="w-full bg-gray-100 dark:bg-gray-700/50 rounded-lg mb-4 flex items-center justify-center overflow-hidden min-h-[200px]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-auto max-h-[300px] object-contain rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Package className="w-16 h-16 mb-2" />
              <span className="text-sm">No image available</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
            <Tag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Category</p>
              <p className="font-medium text-gray-800 dark:text-gray-100">{product.category || 'Uncategorized'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Unit Price</p>
              <p className="font-medium text-gray-800 dark:text-gray-100">
                ₹{product.unit_price.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {product.description && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2 uppercase tracking-wide">
              <AlignLeft size={14} />
              Description
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProductViewModal;
