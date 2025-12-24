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
        <div className="p-2 sm:p-4 lg:p-6 space-y-3 sm:space-y-6">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3">
                    <ClipboardList className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">Staff</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-sm hidden sm:block">Employee performance</p>
                    </div>
                </div>
                <div className="flex gap-1 sm:gap-2">
                    <Button onClick={handleCreateEmployee} size="sm" className="px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm">
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /><span className="hidden sm:inline">Add</span>
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
