import React, { useState, useEffect, useCallback } from 'react';
import { Heart, User, UserPlus, Check, Search } from 'lucide-react';
import { account, databases, databaseId, usersCollectionId, invitesCollectionId } from '../../appwriteConfig';
import { useNavigate } from 'react-router-dom';
import { Models, ID, Query } from 'appwrite';
import { LINK_EXPIRY_OPTIONS } from '../../constants';

interface UserDoc {
  name: string;
  email: string;
  isRecommender: boolean;
  isAdmin: boolean;
}

export const AdminDashboard: React.FC = () => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [recommenders, setRecommenders] = useState<(Models.Document & UserDoc)[]>([]);
  const [linkExpiry, setLinkExpiry] = useState('24');
  const [isRecommenderInvite, setIsRecommenderInvite] = useState(false);
  const [isAdminInvite, setIsAdminInvite] = useState(false);
  const [registrationLink, setRegistrationLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Models.Document & UserDoc)[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const navigate = useNavigate();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchRecommenders = useCallback(async () => {
    try {
      const response = await databases.listDocuments(
        databaseId,
        usersCollectionId,
        [Query.equal('isRecommender', true)]
      );
      setRecommenders(response.documents as (Models.Document & UserDoc)[]);
    } catch (error) {
      console.error("Failed to fetch recommenders:", error);
    }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const loggedInUser = await account.get();
        if (loggedInUser.$id !== '68817300de763e596523') {
          navigate('/dashboard');
          return;
        }
        setUser(loggedInUser);
        fetchRecommenders();
      } catch (error) {
        navigate('/login');
      }
    };
    checkUser();
  }, [navigate, fetchRecommenders]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim() === '') {
        setSearchResults([]);
        return;
      }
      setLoadingSearch(true);
      try {
        const response = await databases.listDocuments(
          databaseId,
          usersCollectionId,
          [Query.startsWith('name_lowercase', searchQuery.toLowerCase())]
        );
        setSearchResults(response.documents as (Models.Document & UserDoc)[]);
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setLoadingSearch(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const generateLink = async () => {
    try {
      const token = ID.unique();
      const expiryTime = new Date(Date.now() + parseInt(linkExpiry, 10) * 60 * 60 * 1000);
      
      await databases.createDocument(databaseId, invitesCollectionId, token, {
        token: token,
        expiresAt: expiryTime.toISOString(),
        isRecommender: isRecommenderInvite,
        isAdmin: isAdminInvite
      });

      const link = `${window.location.origin}/register?token=${token}`;
      setRegistrationLink(link);
    } catch (error) {
      console.error("Error generating registration link:", error);
    }
  };

  const toggleUserStatus = async (targetUser: Models.Document & UserDoc, field: 'isRecommender' | 'isAdmin') => {
    try {
      const updatedUser = await databases.updateDocument(
        databaseId,
        usersCollectionId,
        targetUser.$id,
        { [field]: !targetUser[field] }
      );
      setSearchResults(prev => 
        prev.map(u => u.$id === targetUser.$id ? updatedUser as Models.Document & UserDoc : u)
      );
      if (field === 'isRecommender') {
        fetchRecommenders();
      }
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-red-500" />
              <h1 className="text-xl font-bold text-gray-800">Platform Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline">Dashboard</button>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Generate Teacher Invitation Link
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Link expires in:</label>
              <select value={linkExpiry} onChange={(e) => setLinkExpiry(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                {LINK_EXPIRY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Make this user a recommender?</label>
              <button onClick={() => setIsRecommenderInvite(!isRecommenderInvite)} className={`relative inline-flex items-center h-6 rounded-full w-11 ${isRecommenderInvite ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isRecommenderInvite ? 'translate-x-6' : 'translate-x-1'}`}/>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Make this user an admin?</label>
              <button onClick={() => setIsAdminInvite(!isAdminInvite)} className={`relative inline-flex items-center h-6 rounded-full w-11 ${isAdminInvite ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isAdminInvite ? 'translate-x-6' : 'translate-x-1'}`}/>
              </button>
            </div>
            <button onClick={generateLink} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">Generate Link</button>
            {registrationLink && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Share this link with a new teacher:</p>
                <div className="flex items-center space-x-2">
                  <input type="text" value={registrationLink} readOnly className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-white" />
                  <button 
                    onClick={() => handleCopy(registrationLink)} 
                    className={`px-3 py-1 text-sm rounded transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Manage User Permissions
          </h2>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a teacher by name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <Search className="absolute right-3 top-2.5 text-gray-400" />
          </div>
          <div className="mt-4">
            {loadingSearch && <p>Searching...</p>}
            <div className="space-y-4">
              {searchResults.map(foundUser => (
                <div key={foundUser.$id} className="p-4 border rounded-md">
                  <div>
                    <p className="font-semibold">{foundUser.name}</p>
                    <p className="text-sm text-gray-500">{foundUser.email}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm">Recommender:</label>
                      <button onClick={() => toggleUserStatus(foundUser, 'isRecommender')} className={`relative inline-flex items-center h-6 rounded-full w-11 ${foundUser.isRecommender ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${foundUser.isRecommender ? 'translate-x-6' : 'translate-x-1'}`}/>
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm">Admin:</label>
                      <button onClick={() => toggleUserStatus(foundUser, 'isAdmin')} className={`relative inline-flex items-center h-6 rounded-full w-11 ${foundUser.isAdmin ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${foundUser.isAdmin ? 'translate-x-6' : 'translate-x-1'}`}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Current Recommenders
          </h2>
          <div className="space-y-4">
            {recommenders.map(rec => (
              <div key={rec.$id} className="p-4 border rounded-md flex justify-between items-center">
                <div>
                  <p className="font-semibold">{rec.name}</p>
                  <p className="text-sm text-gray-500">{rec.email}</p>
                </div>
                <button 
                  onClick={() => toggleUserStatus(rec, 'isRecommender')}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

