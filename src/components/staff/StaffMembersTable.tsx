import React from 'react';

interface Employee {
  id: string;
  name: string;
  job_role: string;
  is_active: boolean;
  contact_email?: string;
  contact_phone?: string;
}

interface StaffMembersTableProps {
  employees: Employee[];
}

const StaffMembersTable: React.FC<StaffMembersTableProps> = ({ employees }) => {
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {employees.map((employee) => (
            <tr key={employee.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{employee.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{employee.job_role}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                <div>{employee.contact_email}</div>
                <div className="text-xs">{employee.contact_phone}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(employee.is_active)}`}>
                  {employee.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StaffMembersTable;
