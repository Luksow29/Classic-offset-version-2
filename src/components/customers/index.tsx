// @ts-nocheck
// src/components/customers/index.tsx
import React, { useState } from 'react';
import CustomerTable from './CustomerTable';
import CustomerFormModal from './CustomerFormModal'; 
import Card from '../ui/Card';
import { Customer } from '@/types'; // Import the main Customer type

const CustomersPage: React.FC = () => {
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); 

  const handleEdit = (customer: Customer) => { 
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };
  
  const handleAddNew = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1); // Refresh the table data
    handleCloseModal();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Customers</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your print shop customers</p>
      </div>

      <Card>
        <CustomerTable 
          key={refreshKey} 
          onEdit={handleEdit} 
          onAddNew={handleAddNew} 
        />
      </Card>

      {/* Re-usable Customer Form Modal */}
      {isModalOpen && (
        <CustomerFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          customerToEdit={editingCustomer}
        />
      )}
    </div>
  );
};

export default CustomersPage;
