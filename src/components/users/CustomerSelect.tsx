import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Select from '../ui/Select'; // மேம்படுத்தப்பட்ட Select கூறுகளை இறக்குமதி செய்யவும்

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface CustomerSelectProps {
  onSelect: (selected: { id: string; phone: string; name: string } | null) => void;
  selectedId: string | null;
  label?: string;
  className?: string;
}

const CustomerSelect: React.FC<CustomerSelectProps> = ({ 
  onSelect, 
  selectedId,
  label = "Customer", 
  className 
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone')
        .order('name', { ascending: true });
        
      if (error) {
        console.error('❌ Failed to fetch customers:', error.message);
      } else {
        setCustomers(data || []);
      }
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    const customer = customers.find((c) => c.id === id);
    if (customer) {
      onSelect({ id: customer.id, phone: customer.phone, name: customer.name });
    } else {
      onSelect(null);
    }
  };

  const options = customers.map(c => ({ value: c.id, label: c.name }));

  return (
    <Select
      id="customer-select"
      label={label}
      value={selectedId || ''}
      onChange={handleChange}
      options={options}
      placeholder="-- Select a Customer --"
      disabled={loading}
      className={className}
    />
  );
};

export default CustomerSelect;
