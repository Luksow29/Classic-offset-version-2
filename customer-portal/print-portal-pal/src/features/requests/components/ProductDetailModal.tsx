import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { ImageIcon } from 'lucide-react';
import { Product } from './OrderRequestForm';

interface ProductDetailModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onSelect: (productId: string) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isOpen, onClose, onSelect }) => {
    if (!product) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{product.name}</DialogTitle>
                    <DialogDescription>
                        {product.category}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Image Area */}
                    <div className="w-full h-48 bg-muted rounded-md flex items-center justify-center overflow-hidden border">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="flex flex-col items-center text-muted-foreground">
                                <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
                                <span className="text-xs">No image available</span>
                            </div>
                        )}
                    </div>

                    {/* Price and Description */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-lg">Price</span>
                            <Badge variant="secondary" className="text-base px-3 py-1">
                                ₹{product.unit_price.toLocaleString('en-IN')}
                            </Badge>
                        </div>

                        {product.description && (
                            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md mt-2">
                                {product.description}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex gap-2 sm:justify-end">
                    <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                        Close
                    </Button>
                    <Button
                        onClick={() => {
                            onSelect(String(product.id));
                            onClose();
                        }}
                        className="flex-1 sm:flex-none"
                    >
                        Select Product
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProductDetailModal;
