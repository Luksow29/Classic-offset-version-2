import React from 'react';
import { motion } from 'framer-motion';
import Button from '../../ui/Button';
import { Plus } from 'lucide-react';
import StaffMembersTable from '../StaffMembersTable';
import StaffLogsTable from '../StaffLogsTable';

interface StaffManagementTabProps {
    onAddEmployee: () => void;
    onEditEmployee: (employee: any) => void;
    onDataChange: () => void;
    onAddLog: () => void;
    onEditLog: (log: any) => void;
}

const StaffManagementTab: React.FC<StaffManagementTabProps> = ({
    onAddEmployee,
    onEditEmployee,
    onDataChange,
    onAddLog,
    onEditLog
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
        >
            {/* Staff Members List */}
            <section className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Employee Roster</h2>
                    <Button onClick={onAddEmployee} variant="primary" size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Add Employee
                    </Button>
                </div>
                <StaffMembersTable
                    onAddEmployee={onAddEmployee}
                    onEditEmployee={onEditEmployee}
                    onDataChange={onDataChange}
                />
            </section>

            {/* Staff Work Logs Management */}
            <section className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Staff Work Logs</h2>
                    <Button onClick={onAddLog} variant="primary" size="sm">
                        <Plus className="w-4 h-4 mr-2" /> Add Work Log
                    </Button>
                </div>
                <StaffLogsTable
                    onAddLog={onAddLog}
                    onEditLog={onEditLog}
                    onDataChange={onDataChange}
                />
            </section>
        </motion.div>
    );
};

export default StaffManagementTab;
