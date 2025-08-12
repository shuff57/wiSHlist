import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { AboutView } from './components/auth/AboutView';
import PrivateRoute from './components/auth/PrivateRoute';
import PublicRoute from './components/auth/PublicRoute';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import Settings from './components/teacher/Settings';
import { WishlistEditView } from './components/teacher/WishlistEditView';
import { SupporterLanding } from './components/supporter/SupporterLanding';
import { SupporterView } from './components/supporter/SupporterView';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { Issues } from './components/common/Issues';
import { LoadingBar } from './components/common/LoadingBar';
import { useNavigationProgress } from './hooks/useNavigationProgress';

// Component to handle OAuth redirects and navigation loading
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNavigating = useNavigationProgress();
  const { ensureUserDocument } = useAuth();
  
  useEffect(() => {
    const redirectTo = searchParams.get('redirect');
    const authTime = searchParams.get('auth_time');
    
    if (redirectTo && authTime) {
      // This is an OAuth callback - validate user access with timeout protection
      const validateAndRedirect = async () => {
        try {
          // Add timeout to user document validation to prevent 408 errors
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('User validation timeout')), 25000) // 25 second timeout
          );
          
          await Promise.race([ensureUserDocument(), timeoutPromise]);
          // If validation succeeds, redirect to dashboard
          navigate(`/${redirectTo}`);
        } catch (error) {
          console.warn('User validation failed or timed out:', error);
          // If validation fails, redirect to login with error
          navigate('/?error=access_denied');
        }
      };
      
      // Small delay to ensure authentication state is updated
      setTimeout(validateAndRedirect, 500);
    } else if (redirectTo) {
      // Regular redirect without OAuth validation
      setTimeout(() => {
        navigate(`/${redirectTo}`);
      }, 100);
    }
  }, [navigate, searchParams, ensureUserDocument]);
  
  return (
    <>
      <LoadingBar isLoading={isNavigating} />
      <Routes>
        {/* Public Routes */}
        <Route path="/issues" element={<Issues />} /> {/* Issues page */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<LoginView />} /> {/* Default landing page */}
          <Route path="/login" element={<LoginView />} /> {/* Explicit login route */}
          <Route path="/register" element={<RegisterView />} />
          <Route path="/about" element={<AboutView />} /> {/* About page */}
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
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;