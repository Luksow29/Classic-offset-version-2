import React from 'react';
import Modal from '../ui/Modal';
import { Product } from './ProductMaster';
import { Tag, DollarSign, AlignLeft } from 'lucide-react';

interface ProductViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ProductViewModal: React.FC<ProductViewModalProps> = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product.name} size="lg">
      <div className="space-y-4 pt-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg mb-4">
          <img
            src={product.image_url || '/placeholder.svg'}
            alt={product.name}
            className="w-full h-auto object-contain rounded-lg"
          />
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <Tag className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Category</p>
            <p className="font-medium text-gray-800 dark:text-gray-100">{product.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Unit Price</p>
            <p className="font-medium text-gray-800 dark:text-gray-100">
              ₹{product.unit_price.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {product.description && (
          <div className="p-3">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-2 mb-1">
              <AlignLeft size={16} />
              Description
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProductViewModal;
