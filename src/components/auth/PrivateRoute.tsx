import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { account } from '../../appwriteConfig';
import { Models } from 'appwrite';

const PrivateRoute: React.FC = () => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const loggedInUser = await account.get();
        setUser(loggedInUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
