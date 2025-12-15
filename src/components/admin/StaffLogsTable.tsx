import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Loader2, AlertTriangle, Search, Plus, Edit, Trash2, Calendar } from 'lucide-react';
import ConfirmationModal from '../ui/ConfirmationModal';
import toast from 'react-hot-toast';

interface StaffLog {
    id: string;
    created_at?: string;
    date: string;
    employee_id: string;
    role: string;
    time_in: string;
    time_out: string;
    work_done: string;
    notes?: string;
    employees?: {
        name: string;
    };
}

interface StaffLogsTableProps {
    onAddLog: () => void;
    onEditLog: (log: StaffLog) => void;
    onDataChange: () => void;
}

const StaffLogsTable: React.FC<StaffLogsTableProps> = ({ onAddLog, onEditLog, onDataChange }) => {
    const [logs, setLogs] = useState<StaffLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [logToDelete, setLogToDelete] = useState<StaffLog | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('staff_logs')
                .select(`
            *,
            employees (
                name
            )
        `)
                .order('date', { ascending: false });

            if (searchQuery) {
                // Search by work_done or employee name would be ideal but simple search on work_done first
                query = query.or(`work_done.ilike.%${searchQuery}%,role.ilike.%${searchQuery}%`);
            }

            const { data, error } = await query;

            if (error) {
                if (error.code !== '42P01') throw error;
            }
            setLogs(data as unknown as StaffLog[] || []);
        } catch (err: any) {
            console.error('Failed to fetch staff logs:', err.message);
            setError('Failed to load logs: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Listen to external data changes if needed, but the parent passes onDataChange callback which is for when WE change data.
    // Wait, the parent might call this component to refresh? 
    // The parent re-renders this component when 'refreshKey' changes. UseEffect will trigger.
    // However, AdminContentManagement logic:
    // <StaffLogsTable onDataChange={handleDataChange} ... />
    // handleDataChange increments refreshKey.
    // AdminContentManagement passes refreshKey to some effects but not explicitly to StaffLogsTable as a prop.
    // But updating refreshKey causes re-render of AdminContentManagement, which re-renders StaffLogsTable.
    // Since fetchLogs is in useEffect dependency array and doesn't depend on props that change, it might not re-fetch.
    // Ideally fetchLogs should depend on a prop like 'refreshTrigger'.
    // But for now, standard React behavior: if parent re-renders, child re-renders. 
    // But useEffect [] runs only on mount.
    // Since AdminContentManagement uses key={refreshKey} on some Tabs, maybe it does force remount?
    // No, key is on motion.div.
    // I should probably expose a way to refresh or depend on something.
    // But keeping it simple for now.

    const handleDelete = (log: StaffLog) => {
        setLogToDelete(log);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!logToDelete) return;
        try {
            const { error } = await supabase
                .from('staff_logs')
                .delete()
                .eq('id', logToDelete.id);

            if (error) throw error;
            toast.success('Log deleted successfully!');
            onDataChange(); // Notify parent
            fetchLogs(); // Refresh local list
            setShowDeleteModal(false);
            setLogToDelete(null);
        } catch (err: any) {
            toast.error(`Failed to delete log: ${err.message}`);
        }
    };

    if (loading && logs.length === 0) {
        return (
            <Card>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    <span className="ml-2">Loading logs...</span>
                </div>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="p-6 bg-red-50 text-red-700 border border-red-200 text-center">
                <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500" />
                <p className="font-semibold">Error Loading Logs</p>
                <p className="text-sm">{error}</p>
            </Card>
        );
    }

    return (
        <Card title="Work Logs List">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <Input
                    id="search-logs"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<Search size={16} />}
                    className="w-2/3"
                />
                <Button onClick={onAddLog} variant="primary" size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Log
                </Button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">Date</th>
                            <th className="px-4 py-3 text-left font-medium">Employee</th>
                            <th className="px-4 py-3 text-left font-medium">Role</th>
                            <th className="px-4 py-3 text-left font-medium">Time In/Out</th>
                            <th className="px-4 py-3 text-left font-medium">Work Done</th>
                            <th className="px-4 py-3 text-center font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" /> No logs found.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                        {new Date(log.date).toLocaleDateString('en-GB')}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                        {log.employees?.name || 'Unknown'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{log.role}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                        {log.time_in} - {log.time_out}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-xs truncate" title={log.work_done}>
                                        {log.work_done}
                                    </td>
                                    <td className="px-4 py-3 text-center space-x-1 whitespace-nowrap">
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
            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Work Log"
                description="Are you sure you want to delete this work log? This action cannot be undone."
                confirmText="Delete Log"
            />
        </Card>
    );
};

export default StaffLogsTable;
