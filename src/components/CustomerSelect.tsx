// src/components/CustomerSelect.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface CustomerSelectProps {
  onSelect: (selected: { id: string; phone: string; name: string }) => void;
  value: string; // To control the selected value from the parent
}

const CustomerSelect: React.FC<CustomerSelectProps> = ({ onSelect, value }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedId, setSelectedId] = useState(value);

  // Fetch customers when the component mounts or when the key (version) changes
  const fetchCustomers = useCallback(async () => {
    const { data, error } = await supabase.from('customers').select('id, name, phone').order('name');
    if (error) {
      console.error('❌ Failed to fetch customers:', error.message);
    } else {
      setCustomers(data || []);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Update the internal state if the external value prop changes
  useEffect(() => {
    setSelectedId(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const customer = customers.find((c) => c.id === id);
    if (customer) {
      onSelect({ id: customer.id, phone: customer.phone, name: customer.name });
    }
  };

  return (
    <select
      value={selectedId}
      onChange={handleChange}
      className="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      required
    >
      <option value="">-- Select Customer --</option>
      {customers.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name} ({c.phone})
        </option>
      ))}
    </select>
  );
};

export default CustomerSelect;
