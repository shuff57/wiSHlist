import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account } from '../appwriteConfig'; // Import account

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  logout: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem('darkMode');
    return storedTheme ? JSON.parse(storedTheme) : true;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode: boolean) => !prevMode);
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
    } catch (error) {
    }
  };

  const value = {
    darkMode,
    toggleDarkMode,
    logout,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
