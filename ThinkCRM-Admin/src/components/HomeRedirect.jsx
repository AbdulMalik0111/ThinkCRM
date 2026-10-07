import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const HomeRedirect = () => {
  const { permissions } = useSelector((state) => state.auth);

  if (!permissions) return <Navigate to="/login" />;

  if (permissions.includes('all') || permissions.includes('dashboard.view')) return <Navigate to="/dashboard" />;
  if (permissions.includes('leads.view')) return <Navigate to="/leads" />;
  if (permissions.includes('customers.view')) return <Navigate to="/customers" />;
  if (permissions.includes('users.view')) return <Navigate to="/staff" />;
  if (permissions.includes('reports.view')) return <Navigate to="/reports" />;
  
  // Fallback if they have very limited permissions
  return <Navigate to="/profile" />;
};

export default HomeRedirect;
