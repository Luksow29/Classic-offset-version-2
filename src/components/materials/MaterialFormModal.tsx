import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import TextArea from '../ui/TextArea';
import Button from '../ui/Button';
import { Loader2, AlertCircle } from 'lucide-react';
import { Material, MaterialCategory, Supplier } from './MaterialsPage';
import { logActivity } from '@/lib/activityLogger';
import { useUser } from '@/context/UserContext';

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (materialData: Omit<Material, 'id' | 'created_at' | 'updated_at' | 'stock_status' | 'total_value'>) => Promise<void>;
  editingMaterial: Material | null;
  categories: MaterialCategory[];
  suppliers: Supplier[];
  isLoading: boolean;
}

const MaterialFormModal: React.FC<MaterialFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMaterial,
  categories,
  suppliers,
  isLoading,
}) => {
  const { userProfile } = useUser();
  const [formData, setFormData] = useState({
    material_name: '',
    description: '',
    category_id: '',
    supplier_id: '',
    unit_of_measurement: 'pieces',
    current_quantity: '',
    minimum_stock_level: '',
    cost_per_unit: '',
    storage_location: '',
    purchase_date: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or editing material changes
  useEffect(() => {
    if (isOpen) {
      if (editingMaterial) {
        setFormData({
          material_name: editingMaterial.material_name,
          description: editingMaterial.description || '',
          category_id: editingMaterial.category_id || '',
          supplier_id: editingMaterial.supplier_id || '',
          unit_of_measurement: editingMaterial.unit_of_measurement,
          current_quantity: String(editingMaterial.current_quantity),
          minimum_stock_level: String(editingMaterial.minimum_stock_level),
          cost_per_unit: String(editingMaterial.cost_per_unit),
          storage_location: editingMaterial.storage_location || '',
          purchase_date: editingMaterial.purchase_date || '',
        });
      } else {
        setFormData({
          material_name: '',
          description: '',
          category_id: '',
          supplier_id: '',
          unit_of_measurement: 'pieces',
          current_quantity: '0',
          minimum_stock_level: '0',
          cost_per_unit: '0',
          storage_location: '',
          purchase_date: '',
        });
      }
      setError(null);
    }
  }, [isOpen, editingMaterial]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = () => {
    if (!formData.material_name.trim()) return 'Material name is required';
    if (!formData.unit_of_measurement.trim()) return 'Unit of measurement is required';
    if (parseFloat(formData.current_quantity) < 0) return 'Current quantity cannot be negative';
    if (parseFloat(formData.minimum_stock_level) < 0) return 'Minimum stock level cannot be negative';
    if (parseFloat(formData.cost_per_unit) < 0) return 'Cost per unit cannot be negative';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const materialData = {
        material_name: formData.material_name.trim(),
        description: formData.description.trim() || undefined,
        category_id: formData.category_id || undefined,
        supplier_id: formData.supplier_id || undefined,
        unit_of_measurement: formData.unit_of_measurement.trim(),
        current_quantity: parseFloat(formData.current_quantity),
        minimum_stock_level: parseFloat(formData.minimum_stock_level),
        cost_per_unit: parseFloat(formData.cost_per_unit),
        storage_location: formData.storage_location.trim() || undefined,
        purchase_date: formData.purchase_date || undefined,
        version: editingMaterial?.version || 1,
        is_active: true,
      };
      await onSave(materialData as any);

      // Log activity
      const userName = userProfile?.name || 'Admin';
      const activityMessage = editingMaterial
        ? `Updated material: "${materialData.material_name}"`
        : `Added a new material: "${materialData.material_name}" with an initial quantity of ${materialData.current_quantity} ${materialData.unit_of_measurement}`;
      await logActivity(activityMessage, userName);

    } catch (err: any) {
      setError(err.message || 'Failed to save material');
    }
  };

  const unitOptions = [
    { value: 'pieces', label: 'Pieces' },
    { value: 'kg', label: 'Kilograms' },
    { value: 'grams', label: 'Grams' },
    { value: 'liters', label: 'Liters' },
    { value: 'meters', label: 'Meters' },
    { value: 'sheets', label: 'Sheets' },
    { value: 'boxes', label: 'Boxes' },
    { value: 'rolls', label: 'Rolls' },
    { value: 'bottles', label: 'Bottles' },
    { value: 'packs', label: 'Packs' },
  ];

  const categoryOptions = categories.map(cat => ({ value: cat.id, label: cat.name }));
  const supplierOptions = suppliers.map(sup => ({ value: sup.id, label: sup.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingMaterial ? 'Edit Material' : 'Add New Material'}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="material_name"
            label="Material Name *"
            value={formData.material_name}
            onChange={handleChange}
            required
            disabled={isLoading}
            placeholder="e.g., A4 Paper, Black Ink Cartridge"
          />
          
          <Select
            id="category_id"
            label="Category"
            options={categoryOptions}
            value={formData.category_id}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Select category"
          />
        </div>

        <TextArea
          id="description"
          label="Description"
          value={formData.description}
          onChange={handleChange}
          disabled={isLoading}
          placeholder="Brief description of the material..."
          rows={2}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            id="supplier_id"
            label="Supplier"
            options={supplierOptions}
            value={formData.supplier_id}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Select supplier"
          />
          
          <Input
            id="storage_location"
            label="Storage Location"
            value={formData.storage_location}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="e.g., Warehouse A, Shelf 3"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            id="current_quantity"
            label="Current Quantity *"
            type="number"
            step="0.01"
            min="0"
            value={formData.current_quantity}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          
          <Input
            id="minimum_stock_level"
            label="Minimum Stock Level *"
            type="number"
            step="0.01"
            min="0"
            value={formData.minimum_stock_level}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          
          <Select
            id="unit_of_measurement"
            label="Unit of Measurement *"
            options={unitOptions}
            value={formData.unit_of_measurement}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="cost_per_unit"
            label="Cost per Unit (₹) *"
            type="number"
            step="0.01"
            min="0"
            value={formData.cost_per_unit}
            onChange={handleChange}
            required
            disabled={isLoading}
          />
          
          <Input
            id="purchase_date"
            label="Purchase Date"
            type="date"
            value={formData.purchase_date}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              editingMaterial ? 'Update Material' : 'Save Material'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MaterialFormModal;
