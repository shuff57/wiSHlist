import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingBar } from '../common/LoadingBar';

const PrivateRoute: React.FC = () => {
  const { user, loading } = useAuth();

  return (
    <>
      <LoadingBar isLoading={loading} />
      {loading ? <Outlet /> : (user ? <Outlet /> : <Navigate to="/login" />)}
    </>
  );
};

export default PrivateRoute;
