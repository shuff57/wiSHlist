import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databases, databaseId, wishlistsCollectionId, itemsCollectionId, suggestionsCollectionId } from '../../appwriteConfig';
import { Models, Query, ID } from 'appwrite';
import { ExternalLink, Gift, CheckCircle } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { Header } from '../layout/Header';

interface WishlistDoc {
  teacher_name: string;
  wishlist_name?: string;
  contact_info?: string;
}

interface ItemDoc {
  name: string;
  description?: string;
  store_link?: string;
  cost?: string;
  contributions: number;
}

interface SuggestionForm {
  itemName: string;
  description: string;
  storeLink: string;
  estimatedCost: string;
}

export const SupporterView: React.FC = () => {
  const { wishlistKey } = useParams<{ wishlistKey: string }>();
  const [wishlist, setWishlist] = useState<Models.Document & WishlistDoc | null>(null);
  const [items, setItems] = useState<(Models.Document & ItemDoc)[]>([]);
  const [suggestionForm, setSuggestionForm] = useState<SuggestionForm>({ itemName: '', description: '', storeLink: '', estimatedCost: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchWishlistData = useCallback(async (key: string) => {
    const processedKey = key.trim(); // Normalize the key
    setError(''); // Clear any previous errors
    try {
      const response = await databases.listDocuments(
        databaseId,
        wishlistsCollectionId,
        [Query.equal('wishlist_key', processedKey)]
      );
      if (response.documents.length > 0) {
        const foundWishlist = response.documents[0] as Models.Document & WishlistDoc;
        setWishlist(foundWishlist);
        const itemsResponse = await databases.listDocuments(
          databaseId,
          itemsCollectionId,
          [Query.equal('wishlist_id', foundWishlist.$id)]
        );
        setItems(itemsResponse.documents as (Models.Document & ItemDoc)[]);
      } else {
        setError('No wishlist found with that key.');
      }
    } catch (err: any) {
      setError(`Failed to fetch wishlist: ${err.message || 'Unknown error'}. Please try again.`);
      console.error("Error fetching wishlist:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!wishlistKey) {
      navigate('/');
      return;
    }
    fetchWishlistData(wishlistKey);
  }, [wishlistKey, navigate, fetchWishlistData]);

  const handleMarkContribution = async (item: Models.Document & ItemDoc) => {
    try {
      const newContributions = item.contributions + 1;
      await databases.updateDocument(
        databaseId,
        itemsCollectionId,
        item.$id,
        { contributions: newContributions }
      );
      setItems(prevItems => 
        prevItems.map(i => 
          i.$id === item.$id ? { ...i, contributions: newContributions } : i
        )
      );
    } catch (error) {
      console.error("Error marking contribution:", error);
      alert("Could not mark contribution. Please try again.");
    }
  };

  const handleSuggestionFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSuggestionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlist) return;

    try {
      await databases.createDocument(
        databaseId,
        suggestionsCollectionId,
        ID.unique(),
        {
          wishlist_id: wishlist.$id,
          ...suggestionForm,
          status: 'pending',
          requestedBy: 'Anonymous'
        }
      );
      alert('Suggestion submitted! The teacher will review it soon.');
      setSuggestionForm({ itemName: '', description: '', storeLink: '', estimatedCost: '' });
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      alert("Could not submit suggestion. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  if (error) {
    return (
       <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-gray-700 dark:text-gray-300 mt-4">{error}</p>
        <button onClick={() => navigate('/')} className="mt-6 bg-sky-700 text-white px-6 py-2 rounded-lg hover:bg-sky-900">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header title="wiSHlist" showSettingsButton={false} showSignoutButton={false} showSearch={true} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Help {wishlist?.teacher_name}'s Students Learn & Grow</h2>
          <p className="text-gray-600 dark:text-gray-400">Your contributions make a real difference in our classroom. Thank you for supporting education!</p>
          {wishlist?.contact_info && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <strong>Contact:</strong> {wishlist.contact_info}
            </p>
          )}
        </div>
        
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.length > 0 ? items.map(item => (
              <div key={item.$id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{item.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">{item.description}</p>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    {item.cost && <span className="text-green-600 dark:text-green-400 font-medium">{item.cost}</span>}
                    <span className="text-blue-600 dark:text-blue-400 flex items-center text-sm">
                      <Gift className="w-4 h-4 mr-1" />
                      {item.contributions} contributions
                    </span>
                  </div>
                  <div className="flex flex-col space-y-2">
                    {item.store_link && (
                      <Tooltip text="Opens in a new tab">
                        <a
                          href={item.store_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-800 hover:bg-sky-800 transition duration-200 flex items-center justify-center text-sm font-medium"
                        >
                          Purchase <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Tooltip>
                    )}
                    <Tooltip text="Let the teacher know you've purchased this item">
                      <button
                        onClick={() => handleMarkContribution(item)}
                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-800 transition duration-200 flex items-center justify-center text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        I bought this
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            )) : (
              <div className="md:col-span-2 text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
                <p className="text-gray-600 dark:text-gray-400">This wiSHlist is empty!</p>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Suggest a New Item</h3>
            <form onSubmit={handleSuggestionSubmit} className="space-y-4">
              <input type="text" name="itemName" placeholder="Item Name" value={suggestionForm.itemName} onChange={handleSuggestionFormChange} className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none" required />
              <textarea name="description" placeholder="Description" value={suggestionForm.description} onChange={handleSuggestionFormChange} className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none" />
              <input type="url" name="storeLink" placeholder="Store Link (optional)" value={suggestionForm.storeLink} onChange={handleSuggestionFormChange} className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none" />
              <input type="text" name="estimatedCost" placeholder="Estimated Cost (e.g., $15.00)" value={suggestionForm.estimatedCost} onChange={handleSuggestionFormChange} className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none" />
              <button type="submit" className="w-full bg-purple-700 text-white py-2 px-4 rounded-lg hover:bg-purple-900">Submit Suggestion</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
