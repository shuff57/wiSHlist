import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { account, databases, databaseId, invitesCollectionId, usersCollectionId } from '../../appwriteConfig';
import { AppwriteException, ID, OAuthProvider } from 'appwrite';

import { Header } from '../layout/Header';
import { LoadingBar } from '../common/LoadingBar';
import { useAuth } from '../../context/AuthContext';

interface InviteDoc {
  isRecommender: boolean;
  isAdmin: boolean;
  expiresAt: string;
  userID: string; // ID of the admin who created this invite
}

export const RegisterView: React.FC = () => {
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState<'loading' | 'valid' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteDoc | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const validateToken = async () => {
      const params = new URLSearchParams(location.search);
      const urlToken = params.get('token');

      if (!urlToken) {
        setStatus('error');
        setErrorMessage('Invalid registration link: No token provided.');
        return;
      }

      try {
        const inviteDoc = await databases.getDocument(databaseId, invitesCollectionId, urlToken) as unknown as InviteDoc;
        if (new Date() > new Date(inviteDoc.expiresAt)) {
          setStatus('error');
          setErrorMessage('Registration link has expired.');
          return;
        }
        
        setInvite(inviteDoc);
        setToken(urlToken);
        setStatus('valid');
      } catch (e) {
        setStatus('error');
        setErrorMessage('Invalid or expired registration link.');
      }
    };

    validateToken();
  }, [location.search]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invite) {
      setErrorMessage('Registration token is not valid.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      // Ensure no active session
      try { await account.deleteSession('current'); } catch {}

      const newUser = await account.create(ID.unique(), registerForm.email, registerForm.password, registerForm.name);
      await databases.createDocument(databaseId, usersCollectionId, newUser.$id, {
        name: registerForm.name,
        email: registerForm.email,
        role: 'teacher',
        isRecommender: invite.isRecommender,
        isAdmin: invite.isAdmin,
        userID: invite.userID, // Track who invited this user
        name_lowercase: registerForm.name.toLowerCase()
      });
      await account.createEmailPasswordSession(registerForm.email, registerForm.password);
      await refreshUser(); // Update auth context with new user session
      await databases.deleteDocument(databaseId, invitesCollectionId, token);
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof AppwriteException) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Ensure no active session
      try { await account.deleteSession('current'); } catch {}
      
      account.createOAuth2Session(OAuthProvider.Google, `${window.location.origin}/dashboard`, `${window.location.origin}/`);
    } catch (error) {
      setErrorMessage('Could not start Google registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
        <LoadingBar isLoading={true} />
        <div className="flex items-center justify-center p-4 min-h-screen">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 w-full max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Validating Invitation...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-700 dark:text-gray-300 mt-4">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <Header title="Register" showSettingsButton={false} showSignoutButton={false} showInfoButton={true} isLoading={loading} />
      <div className="flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Teacher Registration</h1>
          </div>
          
          <form onSubmit={handleRegister}>
            <div className="space-y-4">
              {errorMessage && (
                <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg text-sm">
                  {errorMessage}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={registerForm.name}
                  onChange={handleRegisterFormChange}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none"
                  placeholder="Your Name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleRegisterFormChange}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none"
                  placeholder="your-email@example.com"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={registerForm.password}
                  onChange={handleRegisterFormChange}
                  className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-sky-600 text-white py-2 px-4 rounded-lg hover:bg-sky-800 disabled:bg-sky-400"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or</span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleGoogleRegister}
                className="w-full bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-600 transition duration-200 font-medium flex items-center justify-center space-x-2 disabled:bg-gray-200 dark:disabled:bg-gray-500"
                disabled={loading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>{loading ? 'Processing...' : 'Register with Google'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
