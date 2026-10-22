import React from 'react';
import { useSelector } from 'react-redux';

const PermissionGuard = ({ permission, children, fallback = null }) => {
  const { user, permissions } = useSelector((state) => state.auth);

  const role = (user?.role || '').toLowerCase();
  const isSuperUser =
    !user ||
    !user.role ||
    role === 'owner' ||
    role === 'admin' ||
    role === 'superadmin' ||
    role === 'super admin' ||
    role === 'administrator' ||
    (Array.isArray(permissions) && permissions.includes('all'));

  // If superuser, or no specific permission is required, or user has permission
  if (
    isSuperUser ||
    !permission ||
    (Array.isArray(permissions) && (permissions.includes(permission) || permissions.includes('all')))
  ) {
    return <>{children}</>;
  }

  // Otherwise, render fallback (which defaults to nothing)
  return fallback;
};

export default PermissionGuard;
