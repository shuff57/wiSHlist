import React, { useState, useEffect, useCallback } from 'react';
import { account, databases, databaseId, wishlistsCollectionId, usersCollectionId, invitesCollectionId } from '../../appwriteConfig';
import { useNavigate } from 'react-router-dom';
import { Models, ID, Query } from 'appwrite';
import { Heart, Plus, Settings as SettingsIcon, Check, UserPlus } from 'lucide-react';
import { LINK_EXPIRY_OPTIONS } from '../../constants';

interface WishlistDoc {
  teacher_name: string;
  wishlist_key: string;
  wishlist_name?: string;
}

interface UserDoc {
  isRecommender: boolean;
  isAdmin: boolean;
}

export const TeacherDashboard: React.FC = () => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userDoc, setUserDoc] = useState<Models.Document & UserDoc | null>(null);
  const [wishlists, setWishlists] = useState<(Models.Document & WishlistDoc)[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkExpiry, setLinkExpiry] = useState('24');
  const [isRecommenderInvite, setIsRecommenderInvite] = useState(false);
  const [isAdminInvite, setIsAdminInvite] = useState(false);
  const [registrationLink, setRegistrationLink] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const navigate = useNavigate();

  const fetchUserData = useCallback(async (userId: string, userName: string) => {
    try {
      // Try to get the user document
      const userDocument = await databases.getDocument(databaseId, usersCollectionId, userId);
      setUserDoc(userDocument as Models.Document & UserDoc);
    } catch (error: any) {
      // If the document doesn't exist (error code 404), create it
      if (error.code === 404) {
        try {
          const newUserDoc = await databases.createDocument(
            databaseId,
            usersCollectionId,
            userId,
            {
              name: userName,
              isRecommender: false,
              isAdmin: false,
            }
          );
          setUserDoc(newUserDoc as Models.Document & UserDoc);
        } catch (creationError) {
          console.error("Failed to create user document:", creationError);
          navigate('/login'); // Redirect if creation fails
        }
      } else {
        // For any other errors, log it and redirect
        console.error("Failed to fetch user data:", error);
        navigate('/login');
      }
    }

    try {
      // Fetch wishlists regardless of user doc status initially
      const response = await databases.listDocuments(
        databaseId,
        wishlistsCollectionId,
        [Query.equal('teacher_id', userId)]
      );
      setWishlists(response.documents as (Models.Document & WishlistDoc)[]);
    } catch (error) {
      console.error("Failed to fetch wishlists:", error);
    }
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const loggedInUser = await account.get();
        setUser(loggedInUser);
        // Pass both ID and name to fetchUserData
        await fetchUserData(loggedInUser.$id, loggedInUser.name);
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, fetchUserData]);

  const createWishlist = async () => {
    if (!user) return;
    try {
      const newWishlistKey = ID.unique();
      const newWishlist = await databases.createDocument(
        databaseId,
        wishlistsCollectionId,
        ID.unique(),
        {
          teacher_name: user.name,
          teacher_id: user.$id,
          wishlist_key: newWishlistKey,
          wishlist_name: `${user.name}'s New Wishlist`
        }
      );
      setWishlists(prev => [...prev, newWishlist as Models.Document & WishlistDoc]);
    } catch (error) {
      console.error("Error creating wishlist:", error);
    }
  };

  const generateInviteLink = async () => {
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
      console.error("Error generating invite link:", error);
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

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/wishlist/${key}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleInviteCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  if (loading || !user || !userDoc) {
    return <div className="text-center p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
       <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-red-500" />
              <h1 className="text-xl font-bold text-gray-800">Teacher Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/settings')} className="text-gray-600 hover:text-blue-600"><SettingsIcon /></button>
              {userDoc?.isAdmin && (
                <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-blue-600">Admin</button>
              )}
              <span className="text-gray-600">Welcome, {user.name}</span>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 font-medium">Logout</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Your Wishlists</h2>
          <button onClick={createWishlist} className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create New Wishlist
          </button>
        </div>

        {wishlists.length > 0 ? (
          <div className="space-y-4">
            {wishlists.map(wishlist => (
              <div key={wishlist.$id} onClick={() => navigate(`/wishlist/${wishlist.$id}/edit`)} className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg text-gray-900">{wishlist.wishlist_name}</h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCopy(wishlist.wishlist_key); }} 
                    className={`px-3 py-1 text-sm rounded transition-colors ${copiedKey === wishlist.wishlist_key ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {copiedKey === wishlist.wishlist_key ? <Check /> : 'Share Link'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <h3 className="text-xl font-bold text-gray-800">Welcome, {user.name}!</h3>
            <p className="mt-2 text-gray-600">You don't have any wishlists yet. Create one to get started.</p>
          </div>
        )}

        {(userDoc?.isRecommender || userDoc?.isAdmin) && (
          <div className="mt-12 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><UserPlus className="w-5 h-5 mr-2" />Invite a New Teacher</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link expires in:</label>
                <select value={linkExpiry} onChange={(e) => setLinkExpiry(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {LINK_EXPIRY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              {userDoc?.isAdmin && (
                <>
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
                </>
              )}
              <button onClick={generateInviteLink} className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">Generate Invite Link</button>
              {registrationLink && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Share this link with a new teacher:</p>
                  <div className="flex items-center space-x-2">
                    <input type="text" value={registrationLink} readOnly className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded bg-white" />
                    <button 
                      onClick={() => handleInviteCopy(registrationLink)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${copiedInvite ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      {copiedInvite ? <Check /> : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
