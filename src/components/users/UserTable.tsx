// src/components/users/UserTable.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from './UserManagement'; // UserManagement-லிருந்து User type-ஐப் பெறவும்
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { ArrowUpDown, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2, ShieldAlert } from 'lucide-react';

interface UserTableProps {
  onEditUser: (user: User) => void;
  onDataChange: () => void;
  currentUserRole?: 'Owner' | 'Manager' | 'Staff' | null;
  currentUserId?: string | null;
}

const UserTable: React.FC<UserTableProps> = ({ onEditUser, onDataChange, currentUserRole, currentUserId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<keyof User>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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
  }, [fetchUsers, onDataChange]); // onDataChange மாறும்போதும் புதுப்பிக்கவும்

  const handleDelete = async (userToDelete: User) => {
    if (currentUserRole !== 'Owner') return alert('Permission Denied.');
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
    if (currentUserRole !== 'Owner') return alert('Permission Denied.');
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
  if (error) return <div className="p-4 text-red-600 bg-red-50 rounded-md"><ShieldAlert className="inline-block mr-2"/> {error}</div>;

  return (
    <>
      <div className="p-4">
        <Input id="search" placeholder="Search users by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={16}/>} />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase">Status</th>
                    {currentUserRole === 'Owner' && <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase">Actions</th>}
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                    <tr key={user.id}>
                        <td className="px-4 py-3 whitespace-nowrap">{user.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{user.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{user.role}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{user.user_status?.status || 'N/A'}</td>
                        {currentUserRole === 'Owner' && (
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <Button variant="icon" onClick={() => handleStatusToggle(user)} title="Toggle Status">
                                    {user.user_status?.status === 'active' ? <ToggleRight className="text-green-500"/> : <ToggleLeft className="text-red-500"/>}
                                </Button>
                                <Button variant="icon" onClick={() => onEditUser(user)} title="Edit User"><Edit2 size={16}/></Button>
                                <Button variant="icon" onClick={() => handleDelete(user)} title="Delete User"><Trash2 size={16} className="text-red-600"/></Button>
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </>
  );
};

// ✅ இந்த வரிதான் சரிசெய்யப்பட்டுள்ளது
export default UserTable;