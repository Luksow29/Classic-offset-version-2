// src/components/users/UserTable.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from './types';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { ArrowUpDown, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, ShieldAlert, List, LayoutGrid, UserPlus } from 'lucide-react';
import type { StaffRole } from '@/lib/rbac';
import { useResponsiveViewMode } from '../../hooks/useResponsiveViewMode';
import UserGridCard from './UserGridCard';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, Shield, Mail } from 'lucide-react';

interface UserTableProps {
  onEditUser: (user: User) => void;
  onDataChange: () => void;
  currentUserRole?: StaffRole | null;
  currentUserId?: string | null;
}

const UserTable: React.FC<UserTableProps> = ({ onEditUser, onDataChange, currentUserRole, currentUserId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof User>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { viewMode, setViewMode } = useResponsiveViewMode();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, statusResponse] = await Promise.all([
        supabase.from('users').select('*').order(sortField as string, { ascending: sortOrder === 'asc' }),
        supabase.from('user_status').select('user_id, status'),
      ]);
      if (usersResponse.error) throw usersResponse.error;
      if (statusResponse.error) throw statusResponse.error;
      const statusMap = (statusResponse.data || []).reduce((acc: any, curr) => {
        acc[curr.user_id] = { status: curr.status };
        return acc;
      }, {});
      const combinedUsers = (usersResponse.data || []).map(user => ({ ...user, user_status: statusMap[user.id] }));
      setUsers(combinedUsers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sortField, sortOrder]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (userToDelete: User) => {
    if (currentUserRole !== 'owner') return alert('Permission Denied.');
    if (userToDelete.id === currentUserId) return alert("You cannot delete your own account.");
    if (!confirm(`Are you sure you want to delete ${userToDelete.name}?`)) return;

    setLoading(true);
    const { error } = await supabase.from('users').delete().eq('id', userToDelete.id);
    setLoading(false);

    if (error) {
      alert('Error deleting user: ' + error.message);
    } else {
      alert('User deleted successfully.');
      onDataChange();
    }
  };

  const handleStatusToggle = async (userToToggle: User) => {
    if (currentUserRole !== 'owner') return alert('Permission Denied.');
    if (userToToggle.id === currentUserId) return alert("You cannot change your own status.");
    const newStatus = userToToggle.user_status?.status === 'active' ? 'inactive' : 'active';

    setLoading(true);
    const { error } = await supabase.from('user_status').upsert({ user_id: userToToggle.id, status: newStatus }, { onConflict: 'user_id' });
    setLoading(false);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      alert('Status updated successfully.');
      onDataChange();
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    return users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));
  }, [users, search]);

  if (loading) return <div><Loader2 className="animate-spin" /> Loading users...</div>;
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-md"><ShieldAlert className="inline-block mr-2" /> {error}</div>;

  return (
    <>
      <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-auto flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
          <Input
            id="search"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex items-center bg-muted p-1 rounded-lg border border-border/50">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
              title="List View"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'grid'
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4">
        <AnimatePresence mode="wait">
          {viewMode === 'list' ? (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-700"
            >
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                    {currentUserRole === 'owner' && <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <Shield className="w-4 h-4 mr-1.5 text-gray-400" />
                          <span className="capitalize">{user.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.user_status?.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                          {user.user_status?.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      {currentUserRole === 'owner' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleStatusToggle(user)} title="Toggle Status">
                              {user.user_status?.status === 'active' ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-red-500" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onEditUser(user)} title="Edit User"><Edit2 size={16} className="text-blue-600" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(user)} title="Delete User"><Trash2 size={16} className="text-red-600" /></Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {filteredUsers.map((user) => (
                <UserGridCard
                  key={user.id}
                  user={user}
                  currentUserRole={currentUserRole}
                  currentUserId={currentUserId}
                  onEdit={onEditUser}
                  onStatusToggle={handleStatusToggle}
                  onDelete={handleDelete}
                />
              ))}
              {filteredUsers.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                  <p>No users found matching your search.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

// ✅ இந்த வரிதான் சரிசெய்யப்பட்டுள்ளது
export default UserTable;
