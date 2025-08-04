import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingBar } from '../common/LoadingBar';

const PublicRoute: React.FC = () => {
  const { user, loading } = useAuth();

  const shouldRedirect = user && (window.location.pathname === '/' || window.location.pathname === '/register');

  return (
    <>
      <LoadingBar isLoading={loading} />
      {loading ? <Outlet /> : (shouldRedirect ? <Navigate to="/dashboard" /> : <Outlet />)}
    </>
  );
};

export default PublicRoute;
