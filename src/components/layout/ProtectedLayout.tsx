import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Layout from './Layout';
import { useUser } from '../../context/UserContext';
import { supabase } from '@/lib/supabaseClient';

const ProtectedLayout: React.FC = () => {
  const { user, userProfile, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading User...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!userProfile?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Access pending</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Your account is not assigned a staff role yet. Please contact the owner/manager to activate your access.
          </p>
          <button
            className="mt-6 w-full inline-flex items-center justify-center rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedLayout;
