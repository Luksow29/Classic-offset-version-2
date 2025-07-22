// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Loader2, AlertTriangle, Users, UserCog, Search, ArrowUpDown, ExternalLink, Plus, Check, X, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import ConfirmationModal from '../ui/ConfirmationModal';
import EmployeeFormModal from './EmployeeFormModal';
import { toast } from 'react-hot-toast';

interface Employee {
  id: string;
  name: string;
  job_role: string; // employees டேபிளில் job_role இருக்கலாம்
  contact_phone?: string;
  contact_email?: string;
  is_active: boolean;
  app_user_id?: string; // public.users.id ஐக் குறிக்கிறது
  created_at: string;
}

interface StaffMembersTableProps {
  onDataChange: () => void; // தரவு மாறியதும் parent ஐ புதுப்பிக்க
  onAddEmployee: () => void; // புதிய ஊழியரைச் சேர்க்க
  onEditEmployee: (employee: Employee) => void; // ஊழியரைத் திருத்த
}

type SortField = 'name' | 'job_role' | 'created_at' | 'is_active'; // வரிசைப்படுத்துதலுக்கான களங்கள்
type SortOrder = 'asc' | 'desc';

const StaffMembersTable: React.FC<StaffMembersTableProps> = ({ onDataChange, onAddEmployee, onEditEmployee }) => {
  const { userProfile } = useUser();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);


  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('employees').select('*');

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,contact_phone.ilike.%${searchQuery}%,contact_email.ilike.%${searchQuery}%`);
      }

      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      const { data, error } = await query;

      if (error) throw error;
      setEmployees(data || []);
    } catch (err: any) {
      console.error('Failed to fetch employees:', err.message);
      setError('Failed to load employees: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortField, sortOrder]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees, onDataChange]); // onDataChange ஐயும் சேர்க்கவும்

  const handleDelete = (employee: Employee) => {
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can delete employees.');
      return;
    }
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setLoading(true); // தற்காலிகமாக loading ஐ அமைக்கவும்
    try {
      // NOTE: employee_id என்பது staff_logs இல் Foreign Key ஆக இருப்பதால்,
      // இங்கு DELETE CASCADE ஐ Database இல் அமைத்திருக்க வேண்டும்
      // அல்லது முதலில் தொடர்புடைய staff_logs ஐ நீக்க வேண்டும்.
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeToDelete.id);

      if (error) throw error;
      toast.success('Employee deleted successfully!');
      onDataChange();
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete employee:', err.message);
      toast.error(`Failed to delete employee: ${err.message}`);
    } finally {
      // setLoading(false); // fetchEmployees ஆல் கையாளப்படுகிறது
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can toggle employee status.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({ is_active: !employee.is_active })
        .eq('id', employee.id);

      if (error) throw error;
      toast.success(`Employee status changed to ${!employee.is_active ? 'Active' : 'Inactive'}!`);
      onDataChange();
    } catch (err: any) {
      console.error('Failed to toggle employee status:', err.message);
      toast.error(`Failed to toggle status: ${err.message}`);
    } finally {
      // setLoading(false);
    }
  };


  const SortButton: React.FC<{ field: keyof Employee; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => {
        if (sortField === field) {
          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
          setSortField(field);
          setSortOrder('asc');
        }
      }}
      className="flex items-center gap-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
    >
      {children}
      <ArrowUpDown size={14} className={sortField === field ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'} />
    </button>
  );

  if (loading && employees.length === 0) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          <span className="ml-2">Loading employees...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700 text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500" />
        <p className="font-semibold">Error Loading Employees</p>
        <p className="text-sm">{error}</p>
      </Card>
    );
  }

  return (
    <Card title="Staff Members List">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <Input
          id="search-employees"
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search size={16}/>}
          className="w-2/3"
        />
        <Button onClick={onAddEmployee} variant="primary" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Employee
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium"><SortButton field="name">Name</SortButton></th>
              <th className="px-4 py-3 text-left font-medium"><SortButton field="job_role">Job Role</SortButton></th>
              <th className="px-4 py-3 text-left font-medium">Contact</th>
              <th className="px-4 py-3 text-center font-medium"><SortButton field="is_active">Active</SortButton></th>
              <th className="px-4 py-3 text-left font-medium"><SortButton field="created_at">Joined</SortButton></th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50"/> No employees found.
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{employee.name}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{employee.job_role || '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {employee.contact_phone && <div>{employee.contact_phone}</div>}
                    {employee.contact_email && <div className="text-xs text-gray-500">{employee.contact_email}</div>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {employee.is_active ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{new Date(employee.created_at).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => onEditEmployee(employee)} title="Edit Employee">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleToggleActive(employee)} title="Toggle Active">
                      {employee.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(employee)} title="Delete Employee">
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
                    {employee.app_user_id && (userProfile?.role === 'Owner' || userProfile?.role === 'Manager') && (
                      <Link to="/users" className="flex items-center justify-center text-blue-600 hover:underline text-xs">
                        <ExternalLink size={14} /> User Profile
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Employee"
        description={`Are you sure you want to delete ${employeeToDelete?.name}? This action cannot be undone and will affect their work logs.`}
        confirmText="Delete Employee"
      />
    </Card>
  );
};

export default StaffMembersTable;
