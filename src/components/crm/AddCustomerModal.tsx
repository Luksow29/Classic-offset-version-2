// src/components/crm/AddCustomerModal.tsx
import React from 'react';
import Modal from '../ui/Modal';
import CustomerForm from '../customers/CustomerForm';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: () => void;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerAdded
}) => {
  const handleSave = () => {
    onCustomerAdded();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Customer">
      <div className="p-6">
        <CustomerForm
          selectedCustomer={null}
          onSave={handleSave}
          onCancel={onClose}
        />
      </div>
    </Modal>
  );
};

export default AddCustomerModal;
