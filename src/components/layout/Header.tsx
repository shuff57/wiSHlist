import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Settings as SettingsIcon, Home, LogOut, Search, Info, User, ClipboardEdit, ClipboardList, AlertTriangle, ScrollText, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Tooltip } from '../common/Tooltip';
import { LoadingBar } from '../common/LoadingBar';
import { FeedbackModal } from '../common/FeedbackModal';
import { databases, databaseId, wishlistsCollectionId, usersCollectionId } from '../../appwriteConfig';
import { Models, Query } from 'appwrite';

interface WishlistDoc extends Models.Document {
  teacher_name: string;
  wishlist_name?: string;
  wishlist_key: string;
}

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  showSettingsButton?: boolean;
  showSignoutButton?: boolean;
  showSearch?: boolean;
  showInfoButton?: boolean;
  showLoginButton?: boolean;
  isLoading?: boolean;
  hideIssuesButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBackButton = false, onBack, showSettingsButton = true, showSignoutButton = true, showSearch = false, showInfoButton = false, showLoginButton = false, isLoading = false, hideIssuesButton = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const [wishlistKeyInput, setWishlistKeyInput] = useState('');
  const [searchResults, setSearchResults] = useState<WishlistDoc[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<number | null>(null);
  const [activeUsers, setActiveUsers] = useState<number | null>(null);
  // Fetch registered and active users for login page
  useEffect(() => {
    if (showLoginButton && !user) {
      // Registered users: count from users collection
      databases.listDocuments(databaseId, usersCollectionId, []).then(res => {
        setRegisteredUsers(res.total);
      }).catch(() => setRegisteredUsers(null));
      // Active users: count users with lastActive in last 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      databases.listDocuments(
        databaseId,
        usersCollectionId,
        [Query.greaterThan('lastActive', tenMinutesAgo)]
      ).then(res => {
        setActiveUsers(res.total);
      }).catch(() => setActiveUsers(null));
    }
  }, [showLoginButton, user]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log("Logout error (ignoring):", error);
    } finally {
      // Always navigate to home regardless of logout success/failure
      navigate('/');
    }
  };

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (wishlistKeyInput.trim()) {
        setIsSearching(true);
        try {
          // Use exact match instead of fulltext search since no index exists
          const response = await databases.listDocuments(
            databaseId,
            wishlistsCollectionId,
            [Query.equal('wishlist_key', wishlistKeyInput.trim())]
          );
          setSearchResults(response.documents as unknown as WishlistDoc[]);
        } catch (error) {
          console.error("Error searching wishlists:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300); // 300ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [wishlistKeyInput]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      navigate(`/wishlist/${searchResults[0].wishlist_key}`);
      setWishlistKeyInput('');
      setSearchResults([]);
    } else if (e.key === 'Enter' && wishlistKeyInput.trim()) {
      // If no results but user presses enter, navigate directly
      navigate(`/wishlist/${wishlistKeyInput.trim()}`);
      setWishlistKeyInput('');
      setSearchResults([]);
    }
  };

  const handleResultClick = (key: string) => {
    navigate(`/wishlist/${key}`);
    setWishlistKeyInput('');
    setSearchResults([]);
  };

  return (
    <>
      <LoadingBar isLoading={isLoading} />
      <nav className="bg-white dark:bg-neutral-800 shadow-sm border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center w-full">
              <div className="flex items-center space-x-3 flex-1">
                <Image src="/logo.png" alt="wiSHlist Logo" width={32} height={32} className="w-8 h-8 rounded-lg" />
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{title}</h1>
              </div>
              {/* Search in header for all screen sizes */}
              {showSearch && (
                <div className="relative flex items-center mx-4">
                  <input
                    type="text"
                    value={wishlistKeyInput}
                    onChange={(e) => setWishlistKeyInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="px-3 py-1 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 w-40 xs:w-60 pl-9 focus:outline-none"
                    placeholder="Find a wiSHlist"
                  />
                  <div className="absolute left-0 p-2">
                    <Search className="w-4 h-4 xs:w-5 xs:h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  {isSearching && wishlistKeyInput.trim() && (
                    <div className="absolute z-10 w-full bg-white dark:bg-neutral-800 shadow-lg rounded-b-lg border border-t-0 border-gray-300 dark:border-neutral-700 p-2 text-sm text-gray-600 dark:text-gray-300 top-full left-0">
                      Searching...
                    </div>
                  )}
                  {!isSearching && wishlistKeyInput.trim() && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-neutral-800 shadow-lg rounded-b-lg border border-t-0 border-gray-300 dark:border-neutral-700 mt-1 max-h-60 overflow-y-auto top-full left-0">
                      {searchResults.map((wishlist) => (
                        <div
                          key={wishlist.wishlist_key}
                          onClick={() => handleResultClick(wishlist.wishlist_key)}
                          className="p-2 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 text-gray-900 dark:text-gray-200"
                        >
                          {wishlist.wishlist_name || wishlist.wishlist_key}
                        </div>
                      ))}
                    </div>
                  )}
                  {!isSearching && wishlistKeyInput.trim() && searchResults.length === 0 && (
                    <div className="absolute z-10 w-full bg-white dark:bg-neutral-800 shadow-lg rounded-b-lg border border-t-0 border-gray-300 dark:border-neutral-700 p-2 text-sm text-gray-600 dark:text-gray-300 top-full left-0">
                      No wishlists found.
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Hamburger for mobile - only show when less than 600px */}
            <div className="xs:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-none">
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              </button>
            </div>
            {/* Desktop icons - show when 600px or wider */}
            <div className="hidden xs:flex items-center space-x-4 relative"> {/* Added relative for positioning dropdown */}
            {/* ...existing code for desktop icons... */}
            {showBackButton && user && (
              <Tooltip text="Back to Dashboard" position="bottom">
                <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </Tooltip>
            )}
            {showBackButton && !user && (
              <Tooltip text="Back to wiSHlist" position="bottom">
                <button onClick={onBack} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  <ScrollText className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </Tooltip>
            )}
            {showSettingsButton && user && (
              <Tooltip text="Settings" position="bottom">
                <button onClick={() => navigate('/settings')} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </Tooltip>
            )}
            {showInfoButton && (
              <Tooltip text="About" position="bottom">
                <button onClick={() => navigate('/about')} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  <Info className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </Tooltip>
            )}
            {showLoginButton && !user && title !== "Sign In" && (
              <Tooltip text="Sign In" position="bottom">
                <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </Tooltip>
            )}
            <Tooltip text="Send Feedback" position="bottom">
              <button onClick={() => setShowFeedbackModal(true)} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                <ClipboardEdit className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </Tooltip>
            {!hideIssuesButton && (
              <Tooltip text="Current Issues" position="bottom">
                <button onClick={() => navigate('/issues')} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  <AlertTriangle className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </Tooltip>
            )}
            <Tooltip text={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} position="bottom">
              <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
            </Tooltip>
            {showSignoutButton && user && (
              <Tooltip text="Sign Out" position="bottom">
                <button onClick={handleLogout} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  <LogOut className="w-5 h-5 text-red-600" />
                </button>
              </Tooltip>
            )}
            {/* ...end desktop icons... */}
            </div>
          </div>
          {/* Mobile menu dropdown - only show when less than 600px */}
          {mobileMenuOpen && (
            <div className="xs:hidden absolute top-16 right-4 z-50 w-56 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 flex flex-col py-2 animate-fade-in">
              {showBackButton && user && (
                <button onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }} className="flex items-center px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 w-full text-left text-gray-700 dark:text-gray-200">
                  <Home className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" /> Dashboard
                </button>
              )}
              {showBackButton && !user && (
                <button onClick={() => { setMobileMenuOpen(false); onBack && onBack(); }} className="flex items-center px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 w-full text-left text-gray-700 dark:text-gray-200">
                  <ScrollText className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" /> wiSHlist
                </button>
              )}
              {showSettingsButton && user && (
                <button onClick={() => { setMobileMenuOpen(false); navigate('/settings'); }} className="flex items-center px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 w-full text-left text-gray-700 dark:text-gray-200">
                  <SettingsIcon className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" /> Settings
                </button>
              )}
              {showInfoButton && (
                <button onClick={() => { setMobileMenuOpen(false); navigate('/about'); }} className="flex items-center px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 w-full text-left text-gray-700 dark:text-gray-200">
                  <Info className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" /> About
                </button>
              )}
              {showLoginButton && !user && title !== "Sign In" && (
                <button onClick={() => { setMobileMenuOpen(false); navigate('/'); }} className="flex items-center px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 w-full text-left text-gray-700 dark:text-gray-200">
                  <User className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" /> Sign In
                </button>
              )}
              <button onClick={() => { setMobileMenuOpen(false); setShowFeedbackModal(true); }} className="flex items-center px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 w-full text-left text-gray-700 dark:text-gray-200">
                <ClipboardEdit className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" /> Send Feedback
              </button>
              {!hideIssuesButton && (
                <button onClick={() => { setMobileMenuOpen(false); navigate('/issues'); }} className="flex items-center px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 w-full text-left text-gray-700 dark:text-gray-200">
                  <AlertTriangle className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300" /> Current Issues
                </button>
              )}
              <button onClick={() => { setMobileMenuOpen(false); toggleDarkMode(); }} className="flex items-center px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 w-full text-left text-gray-700 dark:text-gray-200">
                {darkMode ? <Sun className="w-5 h-5 mr-3 text-yellow-400" /> : <Moon className="w-5 h-5 mr-3 text-gray-600" />} {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              {showSignoutButton && user && (
                <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="flex items-center px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 w-full text-left text-gray-700 dark:text-gray-200">
                  <LogOut className="w-5 h-5 mr-3 text-red-600" /> Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    {/* User stats badges above the login box, not in header */}
    {showLoginButton && !user && (
      <div className="w-full flex justify-center mt-2 mb-1">
        <div className="flex flex-row items-center space-x-4 w-full max-w-md">
          <span className="inline-flex items-center gap-1 text-sm font-bold text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-md shadow-sm tracking-wide uppercase flex-1 justify-center">
            <ClipboardList className="w-4 h-4 mr-1 text-blue-700 dark:text-blue-200" /> Registered: <span className="ml-1 text-blue-900 dark:text-blue-100 text-lg font-extrabold">{registeredUsers !== null ? registeredUsers : '...'}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/60 px-2 py-0.5 rounded-md shadow-sm tracking-wide uppercase flex-1 justify-center">
            <span className="text-base">🟢</span> Active: <span className="ml-1 text-green-900 dark:text-green-100 text-lg font-extrabold">{activeUsers !== null ? activeUsers : '...'}</span>
          </span>
        </div>
      </div>
    )}
    <FeedbackModal 
      isOpen={showFeedbackModal} 
      onClose={() => setShowFeedbackModal(false)} 
    />
    </>
  );
};