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
        console.log("No valid session found:", error.message);
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
      console.log("Session already invalid or user already logged out:", error.message);
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
      console.log("Session expired during refresh:", error.message);
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
        console.log("✅ User document already exists:", existingDoc);
        return;
      } catch (error: any) {
        console.log("📄 User document not found, will create it. Error:", error.code, error.message);
        
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
          console.log("✅ Created user document successfully:", newDoc);
        } catch (createError: any) {
          console.log("❌ Failed to create user document:", createError.code, createError.message);
          
          if (createError.code === 409) {
            // Document exists but we couldn't read it initially - try again
            console.log("🔄 Document exists (409), trying to fetch again...");
            try {
              const existingDoc = await databases.getDocument(databaseId, usersCollectionId, currentUser.$id);
              console.log("✅ Successfully fetched existing document on retry:", existingDoc);
            } catch (retryError: any) {
              console.log("❌ Still can't fetch document after 409:", retryError.code, retryError.message);
              // This indicates a permissions issue - the document exists but user can't read it
              console.log("⚠️ Document exists but user lacks read permissions");
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Failed to ensure user document:", error);
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
