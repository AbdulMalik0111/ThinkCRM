import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const HomeRedirect = () => {
  const { permissions } = useSelector((state) => state.auth);

  if (!permissions) return <Navigate to="/login" />;

  // Find the highest priority route they have access to
  if (permissions.includes('analytics:read')) return <Navigate to="/dashboard" />;
  if (permissions.includes('orders:read')) return <Navigate to="/orders" />;
  if (permissions.includes('inventory:read')) return <Navigate to="/inventory/overview" />;
  if (permissions.includes('customers:read')) return <Navigate to="/customers" />;
  if (permissions.includes('staff:manage')) return <Navigate to="/staff" />;
  if (permissions.includes('audit:read')) return <Navigate to="/audit" />;
  
  // Fallback if they have very limited permissions
  return <Navigate to="/profile" />;
};

export default HomeRedirect;
