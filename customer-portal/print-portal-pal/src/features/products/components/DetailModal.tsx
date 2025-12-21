import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Product } from './CustomerOrderRequest'; // Assuming Product type is exported from here

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (productId: string) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isOpen, onClose, onSelect }) => {
  if (!product) return null;

  const handleSelect = () => {
    onSelect(String(product.id));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          <DialogDescription>{product.category}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center mb-4">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-gray-500">No Image</span>
            )}
          </div>
          <p className="text-lg font-semibold">₹{product.unit_price.toLocaleString('en-IN')}</p>
          <p className="text-sm text-muted-foreground mt-2">{product.description || 'No description available.'}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSelect}>Select Product</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailModal;
