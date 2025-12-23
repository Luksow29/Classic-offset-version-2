// src/components/users/UserFormModal.tsx
import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, AlertCircle } from 'lucide-react';
import { User } from './types';
import { normalizeStaffRole, STAFF_ROLE_LABEL, type StaffRole } from '@/lib/rbac';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingUser: User | null;
  currentUserRole?: StaffRole | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, editingUser, currentUserRole }) => {
  // படிவத் தரவிற்கான state-கள்
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('office');
  const [password, setPassword] = useState(''); // ✅ புதிய பயனருக்கான கடவுச்சொல்

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name || '');
      setEmail(editingUser.email || '');
      setRole(normalizeStaffRole(editingUser.role) || 'office');
      setPassword(''); // திருத்தும்போது கடவுச்சொல் புலத்தைக் காலியாக வைக்கவும்
    } else {
      setName('');
      setEmail('');
      setRole('office');
      setPassword('');
    }
    setError(null);
  }, [editingUser, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingUser) {
        // --- பயனரைத் திருத்தும் தர்க்கம் ---
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({
            name: name,
            ...(currentUserRole === 'owner' && { role: role }),
          })
          .eq('id', editingUser.id)
          .select()
          .single();
        if (updateError) throw updateError;
        alert('✅ User updated successfully');

      } else {
        // --- புதிய பயனரை உருவாக்கும் தர்க்கம் (சரிசெய்யப்பட்டது) ---
        if (!password) {
          throw new Error("Password is required for new users.");
        }

        // 1. Supabase Auth-ல் பயனரை உருவாக்கவும்
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email,
          password: password,
          options: {
            // இந்த சுயவிவரத் தரவு auth.users.raw_user_meta_data-வில் சேமிக்கப்படும்
            data: {
              full_name: name,
              user_role: role, // ✅ custom claim-க்காக
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Could not create authentication user.");

        console.log('Auth user created:', authData.user);

        // 2. Auth-லிருந்து பெற்ற அதே ID-ஐப் பயன்படுத்தி public.users-இல் சுயவிவரத்தை உருவாக்கவும்
        const { error: profileError } = await supabase.from('users').insert([{
          id: authData.user.id, // ✅ Auth user-இன் ID
          name: name,
          email: email,
          role: role,
        }]);

        if (profileError) {
          // சுயவிவரம் உருவாக்குவதில் பிழை ஏற்பட்டால், Auth பயனரை நீக்கிவிடலாம் (rollback)
          await supabase.auth.admin.deleteUser(authData.user.id);
          throw profileError;
        }

        // 3. user_status அட்டவணையில் பதிவைச் சேர்க்கவும்
        await supabase.from('user_status').insert([{ user_id: authData.user.id, status: 'active' }]);

        alert('✅ User created successfully! They can now log in.');
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal onClose={onClose} title={editingUser ? 'Edit User' : 'Add New User'} isOpen={isOpen}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md text-sm">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
        <Input id="name" label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input id="email" label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!editingUser} />

        {/* புதிய பயனரைச் சேர்க்கும்போது மட்டும் கடவுச்சொல் புலத்தைக் காட்டவும் */}
        {!editingUser && (
          <Input id="password" label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a strong password" required />
        )}

        <Select
          id="role"
          label="User Role"
          value={role}
          onChange={(e) => setRole(e.target.value as StaffRole)}
          options={[
            { value: 'office', label: STAFF_ROLE_LABEL.office },
            { value: 'designer', label: STAFF_ROLE_LABEL.designer },
            { value: 'production', label: STAFF_ROLE_LABEL.production },
            { value: 'purchase', label: STAFF_ROLE_LABEL.purchase },
            { value: 'manager', label: STAFF_ROLE_LABEL.manager },
            ...(currentUserRole === 'owner' ? [{ value: 'owner', label: STAFF_ROLE_LABEL.owner }] : []),
          ]}
          required
          disabled={currentUserRole !== 'owner'}
        />
        <div className="flex justify-end gap-3 pt-5">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button type="submit" loading={loading} variant="primary" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : (editingUser ? 'Save Changes' : 'Create User')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserFormModal;
