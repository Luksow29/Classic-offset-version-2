import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Layout from './Layout';
import { useUser } from '../../context/UserContext';

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading User...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedLayout;