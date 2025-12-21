import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '@/context/UserContext';
import type { StaffRole } from '@/lib/rbac';

interface RequireRolesProps {
  allowed: readonly StaffRole[];
  children: React.ReactNode;
  fallbackPath?: string;
}

const RequireRoles: React.FC<RequireRolesProps> = ({ allowed, children, fallbackPath = '/' }) => {
  const { user, userProfile, loading } = useUser();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!userProfile?.role || !allowed.includes(userProfile.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

export default RequireRoles;

