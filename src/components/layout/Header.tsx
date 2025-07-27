import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Settings as SettingsIcon, Home, LogOut, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Tooltip } from '../common/Tooltip';
import logo from '../../assets/logo.png';
import { databases, databaseId, wishlistsCollectionId } from '../../appwriteConfig';
import { Models, Query } from 'appwrite';

interface WishlistDoc extends Models.Document {
  teacher_name: string;
  wishlist_name?: string;
  wishlist_key: string;
}

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showSettingsButton?: boolean;
  showSignoutButton?: boolean;
  showSearch?: boolean; // New prop
}

export const Header: React.FC<HeaderProps> = ({ title, showBackButton = false, showSettingsButton = true, showSignoutButton = true, showSearch = false }) => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();
  const { logout } = useAuth();
  const [wishlistKeyInput, setWishlistKeyInput] = useState('');
  const [searchResults, setSearchResults] = useState<WishlistDoc[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
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
          setSearchResults(response.documents as WishlistDoc[]);
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
    <nav className="bg-white dark:bg-neutral-800 shadow-sm border-b border-neutral-200 dark:border-neutral-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <img src={logo} alt="wiSHlist Logo" className="w-8 h-8 rounded-lg" />
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{title}</h1>
          </div>
          <div className="flex items-center space-x-4 relative"> {/* Added relative for positioning dropdown */}
            {showBackButton && (
              <Tooltip text="Back to Dashboard" position="bottom">
                <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  <Home className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </Tooltip>
            )}
            {showSearch && (
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={wishlistKeyInput}
                  onChange={(e) => setWishlistKeyInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="px-3 py-1 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 w-60 pl-9 focus:outline-none"
                  placeholder="Find a new wiSHlist"
                />
                <div className="absolute left-0 p-2"> {/* Eyeglass icon always visible */}
                  <Search className="w-5 h-5 text-gray-600 dark:text-gray-300" />
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
            {showSettingsButton && (
              <Tooltip text="Settings" position="bottom">
                <button onClick={() => navigate('/settings')} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                  <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
              </Tooltip>
            )}
            <Tooltip text={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'} position="bottom">
              <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
                {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
              </button>
            </Tooltip>
            {showSignoutButton && (
              <Tooltip text="Logout" position="bottom">
                <button onClick={handleLogout} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700">
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