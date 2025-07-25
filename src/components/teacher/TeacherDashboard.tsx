import React, { useState, useEffect, useCallback } from 'react';
import { account, databases, databaseId, wishlistsCollectionId } from '../../appwriteConfig';
import { useNavigate } from 'react-router-dom';
import { Models, ID, Query } from 'appwrite';
import { Heart, Plus, Settings as SettingsIcon } from 'lucide-react';

interface WishlistDoc {
  teacher_name: string;
  wishlist_key: string;
  wishlist_name?: string;
}

export const TeacherDashboard: React.FC = () => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [wishlists, setWishlists] = useState<(Models.Document & WishlistDoc)[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchWishlists = useCallback(async (userId: string) => {
    try {
      const response = await databases.listDocuments(
        databaseId,
        wishlistsCollectionId,
        [Query.equal('teacher_id', userId)]
      );
      setWishlists(response.documents as (Models.Document & WishlistDoc)[]);
    } catch (error) {
      console.error("Failed to fetch wishlists:", error);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const loggedInUser = await account.get();
        setUser(loggedInUser);
        await fetchWishlists(loggedInUser.$id);
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, fetchWishlists]);

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
      alert("Could not create wishlist. See console for details.");
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

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  if (!user) {
    return null; 
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
              <button onClick={() => navigate('/settings')} className="text-gray-600 hover:text-blue-600">
                <SettingsIcon className="w-6 h-6" />
              </button>
              {user.$id === '68817300de763e596523' && (
                <button onClick={() => navigate('/admin')} className="text-gray-600 hover:text-blue-600">
                  Admin
                </button>
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
              <div key={wishlist.$id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg text-gray-900">{wishlist.wishlist_name}</h3>
                  <button 
                    onClick={() => navigate(`/wishlist/${wishlist.$id}/edit`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Manage
                  </button>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <input type="text" readOnly value={`${window.location.origin}/wishlist/${wishlist.wishlist_key}`} className="w-full text-sm bg-gray-100 p-1 border rounded" />
                  <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/wishlist/${wishlist.wishlist_key}`)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">Copy</button>
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
      </main>
    </div>
  );
};
