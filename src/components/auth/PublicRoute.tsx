import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PublicRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    // If user is logged in, only redirect if they are trying to access the login or register page
    if (window.location.pathname === '/' || window.location.pathname === '/register') {
      return <Navigate to="/dashboard" />;
    }
  }

  return <Outlet />;
};

export default PublicRoute;
