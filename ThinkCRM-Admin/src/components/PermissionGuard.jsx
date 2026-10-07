import React from 'react';
import { useSelector } from 'react-redux';

const PermissionGuard = ({ permission, children, fallback = null }) => {
  const { permissions } = useSelector((state) => state.auth);

  // If no specific permission is required, or the user has it, render children
  if (!permission || (permissions && permissions.includes(permission))) {
    return <>{children}</>;
  }

  // Otherwise, render fallback (which defaults to nothing)
  return fallback;
};

export default PermissionGuard;
