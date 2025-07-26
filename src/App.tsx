import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import PrivateRoute from './components/auth/PrivateRoute';
import PublicRoute from './components/auth/PublicRoute';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { Settings } from './components/teacher/Settings';
import { WishlistEditView } from './components/teacher/WishlistEditView';
import { SupporterLanding } from './components/supporter/SupporterLanding';
import { SupporterView } from './components/supporter/SupporterView';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/" element={<LoginView />} /> {/* Default landing page */}
              <Route path="/register" element={<RegisterView />} />
              <Route path="/supporter" element={<SupporterLanding />} /> {/* Supporter landing page */}
              <Route path="/wishlist/:wishlistKey" element={<SupporterView />} />
            </Route>

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<TeacherDashboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/wishlist/:wishlistId/edit" element={<WishlistEditView />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
