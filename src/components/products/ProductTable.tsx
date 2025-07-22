// src/components/products/ProductTable.tsx
import React, { useMemo, useState } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Eye, Edit, Trash2, Search, FileX, Package, DollarSign, Tag } from 'lucide-react';
import { Product } from './ProductMaster';

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ products, loading, onView, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lowercasedTerm = searchTerm.toLowerCase();
    return products.filter(
      (prod) =>
        prod.name.toLowerCase().includes(lowercasedTerm) ||
        prod.category.toLowerCase().includes(lowercasedTerm)
    );
  }, [products, searchTerm]);

  const TableSkeleton = () => (
    <div className="p-4 space-y-3 animate-pulse">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex justify-between items-center h-12 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <FileX size={48} className="mx-auto mb-4" />
        <h3 className="font-semibold">No Products Found</h3>
        <p className="text-sm">
            {searchTerm ? 'Try adjusting your search term.' : 'Add your first product using the form.'}
        </p>
    </div>
  );

  return (
    <Card>
      <div className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white self-start md:self-center">Product / Service List</h3>
        <div className="relative w-full md:w-auto md:min-w-64">
           <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
             <Search className="w-5 h-5 text-gray-400" />
           </span>
           <Input
            id="search-products"
            placeholder="Search by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10"
          />
        </div>
      </div>

      {loading ? <TableSkeleton /> : (
        <div>
          {/* Mobile View */}
          <div className="md:hidden p-4 space-y-3">
            {filteredProducts.length > 0 ? filteredProducts.map(prod => (
                <div key={prod.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-600">
                    <div className="flex justify-between items-start">
                        <span className="font-bold text-gray-800 dark:text-white break-all">{prod.name}</span>
                        <div className="flex items-center gap-1 flex-shrink-0">
                           <Button variant="icon" size="sm" onClick={() => onView(prod)} title="View"><Eye size={16} /></Button>
                           <Button variant="icon" size="sm" onClick={() => onEdit(prod)} title="Edit"><Edit size={16} /></Button>
                           <Button variant="icon" size="sm" onClick={() => onDelete(prod)} title="Delete"><Trash2 size={16} className="text-red-500" /></Button>
                        </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                        <p className="flex items-center gap-2"><Tag size={14}/> {prod.category}</p>
                        <p className="flex items-center gap-2 font-semibold"><DollarSign size={14}/> ₹{prod.unit_price.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            )) : <EmptyState />}
          </div>

          {/* Desktop View */}
          <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProducts.length > 0 ? filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{prod.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{prod.category}</td>
                    <td className="px-4 py-3 text-right font-semibold">₹{prod.unit_price.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-center space-x-1">
                      <Button variant="icon" size="sm" title="View Product" onClick={() => onView(prod)}><Eye size={16} /></Button>
                      <Button variant="icon" size="sm" title="Edit Product" onClick={() => onEdit(prod)}><Edit size={16} /></Button>
                      <Button variant="icon" size="sm" title="Delete Product" onClick={() => onDelete(prod)}><Trash2 size={16} className="text-red-500" /></Button>
                    </td>
                  </tr>
                )) : <tr><td colSpan={4}><EmptyState /></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProductTable;