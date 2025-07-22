// src/components/staff/StaffLogsTable.tsx
import React from 'react';
// A_FIX: Changed to a more appropriate type name 'StaffLog'
import { StaffLog } from './Staff'; // Import the interface from the main page

interface StaffLogsTableProps {
  logs: StaffLog[];
}

const StaffLogsTable: React.FC<StaffLogsTableProps> = ({ logs }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time In - Out</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Work Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{new Date(log.date).toLocaleDateString('en-GB')}</td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                {log.employees?.users?.name || log.employees?.name || 'N/A'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{log.role}</td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">{log.time_in} - {log.time_out}</td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">{log.work_done}</td>
              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">{log.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StaffLogsTable;
