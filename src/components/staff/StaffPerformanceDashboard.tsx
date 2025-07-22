// src/components/staff/StaffPerformanceDashboard.tsx
import React from 'react';
import MetricCard from '../ui/MetricCard';
import { Users, Clock, CheckSquare } from 'lucide-react';

interface Employee {
  is_active: boolean;
}

interface StaffPerformanceDashboardProps {
  employees: Employee[];
  logs: { work_done: string }[];
}

const StaffPerformanceDashboard: React.FC<StaffPerformanceDashboardProps> = ({ employees, logs }) => {
  const activeStaff = employees.filter(e => e.is_active).length;
  const tasksCompleted = logs.length; // Simple metric: one log = one task

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <MetricCard
        title="Active Staff"
        value={activeStaff.toString()}
        icon={<Users className="w-6 h-6 text-blue-500" />}
      />
      <MetricCard
        title="Total Logs This Period"
        value={tasksCompleted.toString()}
        icon={<CheckSquare className="w-6 h-6 text-green-500" />}
        tooltip="Represents the number of work logs filed."
      />
      <MetricCard
        title="Coming Soon"
        value="- hrs"
        icon={<Clock className="w-6 h-6 text-yellow-500" />}
        tooltip="Total hours worked calculation will be added in a future update."
      />
    </div>
  );
};

export default StaffPerformanceDashboard;
