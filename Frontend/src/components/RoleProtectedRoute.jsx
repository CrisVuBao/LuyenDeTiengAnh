import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (allowedRoles.length > 0 && (!user?.role || !allowedRoles.includes(user.role))) {
    toast.error('Bạn không có quyền truy cập khu vực này');
    // If student tries to access admin -> send to student dashboard
    if (user?.role === 'Student') {
      return <Navigate to="/dashboard" replace />;
    }
    // If admin tries to access student-only area (if any) -> send to admin dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
