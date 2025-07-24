import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginView } from './components/auth/LoginView';
import { WishlistView } from './components/wishlist/WishlistView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import PrivateRoute from './components/auth/PrivateRoute';
import { RegisterView } from './components/auth/RegisterView';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />
        <Route element={<PrivateRoute />}>
          <Route path="/" element={<WishlistView />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
