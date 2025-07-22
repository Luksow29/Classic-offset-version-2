// src/components/staff/enhancements/PayrollCalculator.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Calendar, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface StaffWithPayroll {
  id: number;
  name: string;
  pay_rate: number;
  total_hours: number;
  estimated_salary: number;
}

const PayrollCalculator: React.FC = () => {
  const [staffPayroll, setStaffPayroll] = useState<StaffWithPayroll[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const fetchPayrollData = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('calculate_payroll', {
      start_date: dateRange.start,
      end_date: dateRange.end,
    });

    if (error) {
      toast.error('Failed to calculate payroll.');
      console.error(error);
    } else {
      setStaffPayroll(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPayrollData();
  }, [dateRange]);

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Payroll Calculator</h3>
        <div className="flex gap-4 mb-4 items-center">
            <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="p-2 border rounded"/>
            <span className="font-bold">to</span>
            <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="p-2 border rounded"/>
            <Button onClick={fetchPayrollData} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <Calendar />}
                Calculate
            </Button>
        </div>
        
        {loading ? (
            <div className="text-center p-8"><Loader2 className="animate-spin" size={32}/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Rate (/hr)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Salary</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffPayroll.map(staff => (
                  <tr key={staff.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{staff.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{staff.pay_rate?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{staff.total_hours?.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold">₹{staff.estimated_salary?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PayrollCalculator;
