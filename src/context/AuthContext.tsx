import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, databases, databaseId, usersCollectionId } from '../appwriteConfig';
import { Models } from 'appwrite';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<Models.Session>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  ensureUserDocument: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserSession = async () => {
      setLoading(true);
      try {
        const currentUser = await account.get();
        setUser(currentUser);
      } catch (error: any) {
        // Session expired or invalid - clear user state
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const login = async (email: string, pass: string) => {
    const session = await account.createEmailPasswordSession(email, pass);
    const currentUser = await account.get();
    setUser(currentUser);
    return session;
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch (error: any) {
      // If the session is already invalid or user is already logged out, 
      // we don't need to throw an error - just proceed with cleanup
    } finally {
      // Always clear the user state regardless of whether deleteSession succeeded
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error: any) {
      // Session expired or invalid - clear user state
      setUser(null);
    }
  };

  const ensureUserDocument = async () => {
    try {
      const currentUser = await account.get();
      if (!currentUser) return;

      // Try to fetch existing document first
      try {
        const existingDoc = await databases.getDocument(databaseId, usersCollectionId, currentUser.$id);
        return;
      } catch (error: any) {
        
        // Check if this is Mr. Huff (the main admin)
        const isMrHuff = currentUser.name.toLowerCase().includes('huff') || 
                        currentUser.email.toLowerCase().includes('huff');
        
        try {
          const newDoc = await databases.createDocument(
            databaseId,
            usersCollectionId,
            currentUser.$id,
            {
              name: currentUser.name,
              email: currentUser.email,
              role: 'teacher',
              isRecommender: isMrHuff, // Mr. Huff gets privileges
              isAdmin: isMrHuff,       // Mr. Huff is always admin
              name_lowercase: currentUser.name.toLowerCase()
              // Note: userID field only set when invited by someone
            }
          );
        } catch (createError: any) {
          
          if (createError.code === 409) {
            // Document exists but we couldn't read it initially - try again
            try {
              const existingDoc = await databases.getDocument(databaseId, usersCollectionId, currentUser.$id);
            } catch (retryError: any) {
              // This indicates a permissions issue - the document exists but user can't read it
            }
          }
        }
      }
    } catch (error) {
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    ensureUserDocument,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
