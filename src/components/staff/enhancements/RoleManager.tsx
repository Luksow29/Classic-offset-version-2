// src/components/staff/enhancements/RoleManager.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Plus, Trash2, Edit, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

interface Role {
  id: number;
  role_name: string;
  description: string;
}

const RoleManager: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('staff_roles').select('*');
    if (error) {
      toast.error('Could not fetch roles.');
      console.error(error);
    } else {
      setRoles(data);
    }
    setLoading(false);
  };

  const handleAddRole = async () => {
    if (!newRoleName) {
      toast.error('Role name is required.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('staff_roles').insert({ role_name: newRoleName, description: newRoleDesc });
    if (error) {
      toast.error('Failed to add role.');
    } else {
      toast.success('Role added successfully!');
      setNewRoleName('');
      setNewRoleDesc('');
      fetchRoles();
    }
    setLoading(false);
  };

  const handleDeleteRole = async (id: number) => {
    setLoading(true);
    const { error } = await supabase.from('staff_roles').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete role.');
    } else {
      toast.success('Role deleted.');
      fetchRoles();
    }
    setLoading(false);
  };

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Manage Staff Roles</h3>
        <div className="flex gap-4 mb-4">
          <Input placeholder="New role name" value={newRoleName} onChange={e => setNewRoleName(e.target.value)} />
          <Input placeholder="Description" value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} />
          <Button onClick={handleAddRole} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Plus />}
            Add Role
          </Button>
        </div>
        <div className="space-y-2">
          {roles.map(role => (
            <div key={role.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
              <div>
                <p className="font-bold">{role.role_name}</p>
                <p className="text-sm text-gray-600">{role.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(role.id)} disabled={loading}>
                <Trash2 size={16} className="text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default RoleManager;
