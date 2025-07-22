import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import StaffPerformanceDashboard from './StaffPerformanceDashboard';
import StaffMembersTable from './StaffMembersTable';
import { Loader2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export interface Employee {
  id: string;
  name: string;
  job_role: string;
  is_active: boolean;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface StaffLog {
    id: number;
    date: string;
    role: string;
    time_in: string;
    time_out: string;
    work_done: string;
    notes?: string;
    employees: {
        name: string;
        users: { name: string; } | null;
    } | null;
}

const StaffPage: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [staffLogs, setStaffLogs] = useState<StaffLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [employeesRes, logsRes] = await Promise.all([
                supabase.from('employees').select('*').order('name'),
                supabase.from('staff_logs').select(`*, employees ( name, users ( name ) )`).order('date', { ascending: false }).limit(100)
            ]);

            if (employeesRes.error) throw employeesRes.error;
            if (logsRes.error) throw logsRes.error;
            
            setEmployees(employeesRes.data || []);
            setStaffLogs(logsRes.data as StaffLog[] || []);

        } catch (err: any) {
            setError('Failed to load staff data: ' + err.message);
            toast.error('Failed to load staff data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }

    if (error) {
        return <div className="p-6 bg-red-50 text-red-700 text-center"><AlertTriangle className="mx-auto" /> {error}</div>;
    }

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <h1 className="text-2xl font-semibold">Staff Overview</h1>
            
            <StaffPerformanceDashboard employees={employees} logs={staffLogs} />

            <Card>
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">Staff Members</h2>
                </div>
                
                <div className="p-2">
                    <StaffMembersTable employees={employees} />
                </div>
            </Card>
        </div>
    );
};

export default StaffPage;
