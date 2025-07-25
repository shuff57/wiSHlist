import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import PrivateRoute from './components/auth/PrivateRoute';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { Settings } from './components/teacher/Settings';
import { WishlistEditView } from './components/teacher/WishlistEditView';
import { SupporterLanding } from './components/supporter/SupporterLanding';
import { SupporterView } from './components/supporter/SupporterView';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Supporter Flow */}
        <Route path="/" element={<SupporterLanding />} />
        <Route path="/wishlist/:wishlistKey" element={<SupporterView />} />

        {/* Teacher Authentication */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />

        {/* Protected Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<TeacherDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/wishlist/:wishlistId/edit" element={<WishlistEditView />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
