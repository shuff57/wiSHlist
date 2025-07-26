import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Settings as SettingsIcon, Home, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Tooltip } from '../common/Tooltip';
import logo from '../../assets/logo.png';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showSettingsButton?: boolean;
  showSignoutButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBackButton = false, showSettingsButton = true, showSignoutButton = true }) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white dark:bg-neutral-800 shadow-sm border-b border-neutral-200 dark:border-neutral-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="wiSHlist Logo" className="w-8 h-8 rounded-lg" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Tooltip text="Back to Dashboard" position="bottom">
                <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700">
                  <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </Tooltip>
            )}
            {showSettingsButton && (
              <Tooltip text="Settings" position="bottom">
                <button onClick={() => navigate('/settings')} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700">
                  <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </Tooltip>
            )}
            <Tooltip text={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} position="bottom">
              <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700">
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
            </Tooltip>
            {showSignoutButton && (
              <Tooltip text="Logout" position="bottom">
                <button onClick={handleLogout} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700">
                  <LogOut className="w-5 h-5 text-red-600" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};