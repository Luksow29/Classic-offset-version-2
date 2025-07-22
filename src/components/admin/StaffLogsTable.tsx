// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Loader2, AlertTriangle, Edit, Trash2, Plus, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@/context/UserContext';
import ConfirmationModal from '../ui/ConfirmationModal';
import StaffLogFormModal from './StaffLogFormModal'; // StaffLogFormModal ஐ இறக்குமதி செய்யவும்

interface StaffLog {
  id: number; // அல்லது bigint
  date: string;
  employee_id: string; // user_id க்கு பதிலாக employee_id ஐப் பயன்படுத்துதல்
  role: string; // ஊழியரின் வேலைப் பங்கு
  time_in: string;
  time_out: string;
  work_done: string;
  notes?: string;
  employees: { // 'employees' relation இலிருந்து பெறப்படும் பெயர்
    name: string;
  } | null;
}

interface StaffLogsTableProps {
  onAddLog: () => void; // புதிய பதிவைச் சேர்க்க
  onEditLog: (log: StaffLog) => void; // பதிவைத் திருத்த
  onDataChange: () => void; // தரவு மாறியதும் parent ஐ புதுப்பிக்க
}

type SortField = 'date' | 'employees.name' | 'role' | 'time_in'; // Sort by employees.name
type SortOrder = 'asc' | 'desc';

const StaffLogsTable: React.FC<StaffLogsTableProps> = ({ onAddLog, onEditLog, onDataChange }) => {
  const { userProfile } = useUser();
  const [staffLogs, setStaffLogs] = useState<StaffLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [logToDelete, setLogToDelete] = useState<StaffLog | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const fetchStaffLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('staff_logs')
        .select(`
          *,
          employees (name) -- employee_id ஐப் பயன்படுத்தி 'employees' டேபிளிலிருந்து பெயரைப் பெறவும்
        `)
        .order(sortField === 'employees.name' ? 'employees.name' : sortField, { ascending: sortOrder === 'asc' }); // Sort by joined relation
        // குறிப்பு: 'employees.name' இல் வரிசைப்படுத்தினால், சில சமயங்களில் RLS கொள்கைகளில் சிக்கல் வரலாம் அல்லது செயல்திறன் குறையலாம்.

      if (error) throw error;
      setStaffLogs(data || []);
    } catch (err: any) {
      console.error('Failed to fetch staff logs:', err.message);
      setError('Failed to load staff logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [sortField, sortOrder]);

  useEffect(() => {
    fetchStaffLogs();
  }, [fetchStaffLogs, onDataChange]); // onDataChange மாறும்போதும் புதுப்பிக்கவும்

  const handleDelete = (log: StaffLog) => {
    if (!userProfile || (userProfile.role !== 'Owner' && userProfile.role !== 'Manager')) {
      toast.error('Permission denied: Only Owners and Managers can delete work logs.');
      return;
    }
    setLogToDelete(log);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!logToDelete) return;
    setLoading(true); // தற்காலிகமாக loading ஐ அமைக்கவும்
    try {
      const { error } = await supabase
        .from('staff_logs')
        .delete()
        .eq('id', logToDelete.id);

      if (error) throw error;
      toast.success('Work log deleted successfully!');
      onDataChange();
      setShowDeleteModal(false);
      setLogToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete work log:', err.message);
      toast.error(`Failed to delete work log: ${err.message}`);
    } finally {
      // setLoading(false); // fetchStaffLogs ஆல் கையாளப்படுகிறது
    }
  };

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
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

  return (
    <Card title="Staff Work Logs">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-end">
        <Button onClick={onAddLog} variant="primary" size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Work Log
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium"><SortButton field="date">Date</SortButton></th>
              <th className="px-4 py-3 text-left font-medium"><SortButton field="employees.name">Staff Name</SortButton></th> {/* Sort by employees.name */}
              <th className="px-4 py-3 text-left font-medium"><SortButton field="role">Role</SortButton></th>
              <th className="px-4 py-3 text-left font-medium"><SortButton field="time_in">Time In - Out</SortButton></th>
              <th className="px-4 py-3 text-left font-medium">Work Description</th>
              <th className="px-4 py-3 text-left font-medium">Notes</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading && staffLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2"/> Loading logs...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2"/> {error}
                </td>
              </tr>
            ) : staffLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No staff logs found. Click "Add Work Log" to add one.
                </td>
              </tr>
            ) : (
              staffLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{new Date(log.date).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{log.employees?.name || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{log.role}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{log.time_in} - {log.time_out}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{log.work_done}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{log.notes || '-'}</td>
                  <td className="px-4 py-3 text-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => onEditLog(log)} title="Edit Log">
                      <Edit size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(log)} title="Delete Log">
                      <Trash2 size={16} className="text-red-500" />
                    </Button>
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
        title="Delete Work Log"
        description={`Are you sure you want to delete this work log for ${logToDelete?.employees?.name || 'this staff member'}? This action cannot be undone.`}
        confirmText="Delete Log"
      />
    </Card>
  );
};

export default StaffLogsTable;
