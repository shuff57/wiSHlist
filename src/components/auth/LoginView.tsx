import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { account } from '../../appwriteConfig';
import { AppwriteException, OAuthProvider } from 'appwrite';
import { Header } from '../layout/Header';
import { Link } from 'react-router-dom';
export const LoginView: React.FC = () => {
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await account.createOAuth2Session(OAuthProvider.Google, `${window.location.origin}/dashboard`, `${window.location.origin}/`);
    } catch (error) {
      if (error instanceof AppwriteException) {
        setLoginError(error.message);
      } else {
        setLoginError('An unexpected error occurred.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="Login" showSettingsButton={false} showSignoutButton={false} />
      <div className="flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Classroom Wishlist</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Supporting Ms. Johnson's 3rd Grade Class</p>
          </div>
          
          {loginError && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm mb-4">
              {loginError}
            </div>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Please sign in to continue</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-200 font-medium flex items-center justify-center space-x-2 disabled:bg-gray-200 dark:disabled:bg-gray-500"
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{loading ? 'Processing...' : 'Sign in with Google'}</span>
              </button>
              <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Are you a supporter? <Link to="/supporter" className="text-blue-600 hover:underline">Find a wiSHlist</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
