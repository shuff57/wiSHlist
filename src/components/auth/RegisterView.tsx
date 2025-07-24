import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { account, databases, databaseId, usersCollectionId, invitesCollectionId } from '../../appwriteConfig';
import { AppwriteException, ID, OAuthProvider, Query } from 'appwrite';
import { Heart } from 'lucide-react';

export const RegisterView: React.FC = () => {
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState<'loading' | 'valid' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const completeOAuthRegistration = useCallback(async (urlToken: string) => {
    try {
      const user = await account.get();
      
      // Check if user document already exists
      const userDocs = await databases.listDocuments(databaseId, usersCollectionId, [Query.equal('email', user.email)]);
      if (userDocs.total === 0) {
        await databases.createDocument(databaseId, usersCollectionId, user.$id, {
          name: user.name,
          email: user.email,
          role: 'supporter'
        });
      }
      
      await databases.deleteDocument(databaseId, invitesCollectionId, urlToken);
      navigate('/');
    } catch (error) {
      setStatus('error');
      if (error instanceof AppwriteException) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred during OAuth completion.');
      }
    }
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');

    if (!urlToken) {
      setStatus('error');
      setErrorMessage('Invalid registration link: No token provided.');
      return;
    }

    const processRegistration = async () => {
      try {
        // Check for an active session first (returning from OAuth)
        await account.get();
        // If successful, a session exists, complete the registration
        completeOAuthRegistration(urlToken);
      } catch (error) {
        // No active session, so validate the token for a new user
        try {
          const inviteDoc = await databases.getDocument(databaseId, invitesCollectionId, urlToken);
          const expires = inviteDoc.expiresAt as string;
          if (new Date() > new Date(expires)) {
            setStatus('error');
            setErrorMessage('Registration link has expired.');
          } else {
            setToken(urlToken);
            setStatus('valid');
          }
        } catch (e) {
          setStatus('error');
          setErrorMessage('Invalid or expired registration link.');
        }
      }
    };

    processRegistration();
  }, [location.search, completeOAuthRegistration]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMessage('Registration token is not valid.');
      return;
    }
    setErrorMessage('');
    try {
      const newUser = await account.create(ID.unique(), registerForm.email, registerForm.password, registerForm.name);
      await databases.createDocument(databaseId, usersCollectionId, newUser.$id, {
        name: registerForm.name,
        email: registerForm.email,
        role: 'supporter'
      });
      await databases.deleteDocument(databaseId, invitesCollectionId, token);
      await account.createEmailPasswordSession(registerForm.email, registerForm.password);
      navigate('/');
    } catch (error) {
      if (error instanceof AppwriteException) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    }
  };

  const handleGoogleRegister = async () => {
    if (!token) {
      setErrorMessage('Registration token is not valid.');
      return;
    }
    try {
      account.createOAuth2Session(OAuthProvider.Google, `${window.location.origin}/register?token=${token}`, `${window.location.origin}/`);
    } catch (error) {
      if (error instanceof AppwriteException) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred during Google registration.');
      }
    }
  };

  const handleRegisterFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-800">Validating...</h1>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-700 mt-4">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Create an Account</h1>
        </div>
        
        <form onSubmit={handleRegister}>
          <div className="space-y-4">
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={registerForm.name}
                onChange={handleRegisterFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={registerForm.email}
                onChange={handleRegisterFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your-email@example.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={registerForm.password}
                onChange={handleRegisterFormChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
            >
              Register
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={handleGoogleRegister}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition duration-200 font-medium flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Register with Google</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
