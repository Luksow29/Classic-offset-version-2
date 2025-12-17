// src/components/users/UserManagement.tsx
import React, { useState } from 'react';
import UserTable from './UserTable';
import UserFormModal from './UserFormModal'; // ✅ சரிசெய்யப்பட்ட இறக்குமதி
import { useUser } from '@/context/UserContext';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { UserPlus } from 'lucide-react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
  user_status?: { status: 'active' | 'inactive' | 'suspended'; } | null;
  [key: string]: any;
}

const UserManagement: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserFormModal, setShowUserFormModal] = useState(false);

  const { user, userProfile } = useUser();
  const currentUserRole = userProfile?.role;
  const currentUserId = user?.id;

  const handleDataChange = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setShowUserFormModal(true);
  };

  const handleOpenEditModal = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setShowUserFormModal(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">👥 User Management</h1>
        {currentUserRole === 'owner' && (
          <Button onClick={handleOpenAddModal} variant="primary" className="flex items-center w-full sm:w-auto">
            <UserPlus className="w-5 h-5 mr-2" />
            Add New User
          </Button>
        )}
      </div>

      <Card>
        <UserTable
          key={refreshKey}
          onEditUser={handleOpenEditModal}
          currentUserRole={currentUserRole}
          currentUserId={currentUserId}
          onDataChange={handleDataChange}
        />
      </Card>

      {/* ✅ இங்கே UserFormModal பயன்படுத்தப்படுகிறது */}
      {showUserFormModal && (
        <UserFormModal
          isOpen={showUserFormModal}
          onClose={() => setShowUserFormModal(false)}
          onSave={handleDataChange}
          editingUser={editingUser}
          currentUserRole={currentUserRole}
        />
      )}
    </div>
  );
};

export default UserManagement;
