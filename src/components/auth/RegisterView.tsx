import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { account, databases, databaseId, invitesCollectionId, usersCollectionId } from '../../appwriteConfig';
import { AppwriteException, ID, OAuthProvider } from 'appwrite';
import { Heart } from 'lucide-react';
import { Header } from '../layout/Header';
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
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Validating Invitation...</h1>
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
      <Header title="Register" showSettingsButton={false} showSignoutButton={false} isLoading={loading} />
      <div className="flex items-center justify-center p-4">
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
                className="w-full bg-white bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-200 disabled:bg-gray-200 dark:disabled:bg-gray-500"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Register with Google'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
