import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Mail, Calendar, Shield, ToggleLeft, ToggleRight, Edit2, Trash2, User as UserIcon } from 'lucide-react';
import { User } from './types';
import type { StaffRole } from '@/lib/rbac';

interface UserGridCardProps {
    user: User;
    currentUserRole?: StaffRole | null;
    currentUserId?: string | null;
    onEdit: (user: User) => void;
    onStatusToggle: (user: User) => void;
    onDelete: (user: User) => void;
}

const UserGridCard: React.FC<UserGridCardProps> = ({
    user,
    currentUserRole,
    currentUserId,
    onEdit,
    onStatusToggle,
    onDelete
}) => {
    return (
        <Card className="hover:shadow-md transition-shadow dark:bg-gray-800">
            <div className="p-4 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <UserIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white">{user.name}</h4>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                <Shield className="w-3 h-3" />
                                <span className="capitalize">{user.role}</span>
                            </div>
                        </div>
                    </div>
                    <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.user_status?.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900'
                        }`}>
                        {user.user_status?.status === 'active' ? 'Active' : 'Inactive'}
                    </div>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                {currentUserRole === 'owner' && (
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStatusToggle(user)}
                            title={user.user_status?.status === 'active' ? 'Deactivate User' : 'Activate User'}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                        >
                            {user.user_status?.status === 'active' ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-red-500" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(user)}
                            title="Edit User"
                            className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                            <Edit2 className="w-4 h-4" />
                        </Button>
                        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(user)}
                            title="Delete User"
                            className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
};

export default UserGridCard;
