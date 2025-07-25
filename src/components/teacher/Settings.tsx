import React, { useState, useEffect, useCallback } from 'react';
import { account, databases, databaseId, usersCollectionId, invitesCollectionId } from '../../appwriteConfig';
import { useNavigate } from 'react-router-dom';
import { Models, ID, Query } from 'appwrite';
import { Save, User, UserPlus, Check, Search } from 'lucide-react';
import { LINK_EXPIRY_OPTIONS } from '../../constants';
import { Header } from '../layout/Header';
import { Tooltip } from '../common/Tooltip';

interface UserDoc {
  name: string;
  email: string;
  isRecommender: boolean;
  isAdmin: boolean;
}

export const Settings: React.FC = () => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userDoc, setUserDoc] = useState<(Models.Document & UserDoc) | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State from AdminDashboard
  const [privilegedUsers, setPrivilegedUsers] = useState<(Models.Document & UserDoc)[]>([]);
  const [linkExpiry, setLinkExpiry] = useState('24');
  const [isRecommenderInvite, setIsRecommenderInvite] = useState(false);
  const [isAdminInvite, setIsAdminInvite] = useState(false);
  const [registrationLink, setRegistrationLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(Models.Document & UserDoc)[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  
  const navigate = useNavigate();

  const fetchPrivilegedUsers = useCallback(async () => {
    try {
      const [recommenders, admins] = await Promise.all([
        databases.listDocuments(databaseId, usersCollectionId, [Query.equal('isRecommender', true)]),
        databases.listDocuments(databaseId, usersCollectionId, [Query.equal('isAdmin', true)])
      ]);
      
      const combined = [...recommenders.documents, ...admins.documents];
      const uniqueUsers = Array.from(new Set(combined.map(u => u.$id))).map(id => combined.find(u => u.$id === id));
      setPrivilegedUsers(uniqueUsers as (Models.Document & UserDoc)[]);
    } catch (error) {
      console.error("Failed to fetch privileged users:", error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const loggedInUser = await account.get();
        setUser(loggedInUser);
        setName(loggedInUser.name);
        
        const doc = await databases.getDocument(databaseId, usersCollectionId, loggedInUser.$id);
        setUserDoc(doc as Models.Document & UserDoc);

        if ((doc as any).isAdmin || (doc as any).isRecommender) {
          fetchPrivilegedUsers();
        }

      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, fetchPrivilegedUsers]);

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

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || name === user.name) return;
    setSaving(true);

    try {
      await account.updateName(name);
      alert('Name updated successfully!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please check the console for details.");
    } finally {
      setSaving(false);
    }
  };
  
  // Functions from AdminDashboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      fetchPrivilegedUsers(); // Refetch the main list
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  const usersToDisplay = searchQuery.trim() ? searchResults : privilegedUsers;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-gray-800 dark:text-gray-200">
      <Header title="Profile Settings" showBackButton={true} showSettingsButton={false} />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-8">
          <div className="space-y-6">
            <form onSubmit={handleSaveChanges} className="space-y-6">
              <div>
                <label className="block text-sm font-medium">Display Name</label>
                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm bg-white dark:bg-neutral-700"
                />
              </div>
              <div className="text-right">
                <Tooltip text="Save your new display name">
                  <button
                    type="submit"
                    disabled={saving || name === user?.name}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </Tooltip>
              </div>
            </form>
          </div>
        </div>

        {/* Admin Section */}
        {(userDoc?.isAdmin || userDoc?.isRecommender) && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              Generate Teacher Invitation Link
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Link expires in:</label>
                <select value={linkExpiry} onChange={(e) => setLinkExpiry(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700">
                  {LINK_EXPIRY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              {userDoc?.isAdmin && (
                <>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Make this user a recommender?</label>
                  <button onClick={() => setIsRecommenderInvite(!isRecommenderInvite)} className={`relative inline-flex items-center h-6 rounded-full w-11 ${isRecommenderInvite ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isRecommenderInvite ? 'translate-x-6' : 'translate-x-1'}`}/>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Make this user an admin?</label>
                  <button onClick={() => setIsAdminInvite(!isAdminInvite)} className={`relative inline-flex items-center h-6 rounded-full w-11 ${isAdminInvite ? 'bg-blue-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isAdminInvite ? 'translate-x-6' : 'translate-x-1'}`}/>
                  </button>
                </div>
                </>
              )}
              <Tooltip text="Generate a new, single-use registration link">
                <button onClick={generateLink} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">Generate Link</button>
              </Tooltip>
              {registrationLink && (
                <div className="mt-4 p-3 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
                  <p className="text-sm mb-2">Share this link with a new teacher:</p>
                  <div className="flex items-center space-x-2">
                    <input type="text" value={registrationLink} readOnly className="flex-1 px-2 py-1 text-sm border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-600" />
                    <Tooltip text="Copy to clipboard">
                      <button 
                        onClick={() => handleCopy(registrationLink)} 
                        className={`px-3 py-1 text-sm rounded transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                        {copied ? <Check className="w-4 h-4" /> : 'Copy'}
                      </button>
                    </Tooltip>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {userDoc?.isAdmin && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Manage User Permissions
            </h2>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a teacher by name..."
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" />
            </div>
            <div className="mt-4">
              {loadingSearch && <p>Searching...</p>}
              <div className="space-y-4">
                {usersToDisplay.map(foundUser => (
                  <div key={foundUser.$id} className="p-4 border dark:border-neutral-700 rounded-md">
                    <div>
                      <p className="font-semibold">{foundUser.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{foundUser.email}</p>
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
        )}
      </main>
    </div>
  );
};