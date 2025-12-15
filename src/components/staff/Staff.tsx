import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { Plus, ClipboardList } from 'lucide-react';
import Button from '../ui/Button';
import StaffPerformanceDashboard from './StaffPerformanceDashboard';
import StaffLogsTable from './StaffLogsTable';
import EmployeeFormModal from './EmployeeFormModal';

// Interfaces needed for sub-components
export interface StaffLog {
    id: string;
    created_at?: string;
    date: string;
    employee_id?: string;
    role: string;
    time_in: string;
    time_out: string;
    work_done: string;
    notes?: string;
    employees?: {
        name: string;
        users?: {
            name: string;
        };
    };
}

export interface Employee {
    id: string;
    name: string;
    role: string;
    email?: string;
    phone?: string;
    status: 'Active' | 'On Leave' | 'Terminated';
    is_active?: boolean; // For dashboard compatibility
}

const Staff: React.FC = () => {
    const [logs, setLogs] = useState<StaffLog[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Logs
            const { data: logsData, error: logsError } = await supabase
                .from('staff_logs')
                .select(`
          *,
          employees (
            name
          )
        `)
                .order('date', { ascending: false });

            if (logsError) {
                // Only log error if it's not a missing table error, to be less noisy
                if (logsError.code !== '42P01') {
                    console.error('Error fetching logs:', logsError);
                }
            }

            // Fetch Employees
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('*')
                .order('name');

            if (empError) {
                if (empError.code !== '42P01') {
                    console.error('Error fetching employees:', empError);
                }
            }

            setLogs(logsData as unknown as StaffLog[] || []);
            setEmployees(empData as unknown as Employee[] || []);

        } catch (error) {
            console.error('Unexpected error fetching staff data:', error);
            toast.error('Failed to load staff data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateEmployee = () => {
        setEditingEmployee(null);
        setShowEmployeeModal(true);
    };

    const handleSaveEmployee = () => {
        fetchData();
        setShowEmployeeModal(false);
    };

    // Map employees for dashboard (it expects is_active boolean)
    const dashboardEmployees = employees.map(e => ({
        ...e,
        is_active: e.status === 'Active'
    }));

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Staff Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Monitor employee performance and daily logs</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleCreateEmployee}>
                        <Plus className="w-4 h-4 mr-2" /> Add Employee
                    </Button>
                    <Button variant="outline" onClick={() => toast('Feature coming soon!')}>
                        <ClipboardList className="w-4 h-4 mr-2" /> Add Log
                    </Button>
                </div>
            </div>

            <StaffPerformanceDashboard
                employees={dashboardEmployees}
                logs={logs.map(l => ({ work_done: l.work_done }))}
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Work Logs</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading staff data...</div>
                ) : (
                    <StaffLogsTable logs={logs} />
                )}
            </div>

            <EmployeeFormModal
                isOpen={showEmployeeModal}
                onClose={() => setShowEmployeeModal(false)}
                onSave={handleSaveEmployee}
                employee={editingEmployee}
            />
        </div>
    );
};

export default Staff;
