import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const HomeRedirect = () => {
  const { user, isAuth } = useSelector((state) => state.auth);

  if (!isAuth && !user) return <Navigate to="/login" replace />;

  return <Navigate to="/dashboard" replace />;
};

export default HomeRedirect;

