// @ts-nocheck
// src/components/customers/CustomerFormModal.tsx
import React from 'react';
import Modal from '../ui/Modal';
import CustomerForm from './CustomerForm';
import { Customer } from '@/types';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCustomer?: Customer) => void;
  customerToEdit?: Customer | null;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSuccess, customerToEdit }) => {
  
  const handleSave = () => {
    // The `onSuccess` logic might need to be enhanced if the parent component
    // needs the full customer object after creation/update.
    // For now, we assume the parent will refetch or handle it.
    onSuccess(customerToEdit || {} as Customer);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={customerToEdit ? "Edit Customer" : "Add a New Customer"}>
      <div className="p-6">
        <CustomerForm
          selectedCustomer={customerToEdit || null}
          onSave={handleSave}
          onCancel={onClose}
        />
      </div>
    </Modal>
  );
};

export default CustomerFormModal;
