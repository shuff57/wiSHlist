import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databases, databaseId, wishlistsCollectionId, itemsCollectionId, suggestionsCollectionId } from '../../appwriteConfig';
import { Models, Query, ID } from 'appwrite';
import { ExternalLink, Gift, CheckCircle, Grid, List } from 'lucide-react';
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
  const [submitButtonText, setSubmitButtonText] = useState<string>('Submit Suggestion');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
        const foundWishlist = response.documents[0] as unknown as Models.Document & WishlistDoc;
        setWishlist(foundWishlist);
        const itemsResponse = await databases.listDocuments(
          databaseId,
          itemsCollectionId,
          [Query.equal('wishlist_id', foundWishlist.$id)]
        );
        setItems(itemsResponse.documents as unknown as (Models.Document & ItemDoc)[]);
        sessionStorage.setItem('lastVisitedWishlist', processedKey);
      } else {
        setError('No wishlist found with that key. Please check the key and try again.');
      }
    } catch (err: any) {
      setError(`Failed to fetch wishlist: ${err.message || 'Unknown error'}. Please try again.`);
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
      setSubmitButtonText('Submitted for Review');
      setTimeout(() => {
        setSubmitButtonText('Submit Suggestion');
      }, 3000); // Change back after 3 seconds
      setSubmissionSuccess(true);
      setTimeout(() => setSubmissionSuccess(false), 3000);
      setSuggestionForm({ itemName: '', description: '', storeLink: '', estimatedCost: '' });
    } catch (error) {
      alert("Could not submit suggestion. Please try again.");
    }
  };

  if (error) {
    return (
       <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-gray-700 dark:text-gray-300 mt-4">{error}</p>
        <button onClick={() => wishlistKey && navigate(`/wishlist/${wishlistKey}`)} className="mt-6 bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-800">
          Return to Wishlist
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <Header title="wiSHlist" showSettingsButton={false} showSignoutButton={false} showSearch={true} showInfoButton={true} isLoading={loading} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Help {wishlist?.teacher_name}&apos;s Students Learn & Grow</h2>
          <p className="text-gray-600 dark:text-gray-400">Your contributions make a real difference in our classroom. Thank you for supporting education!</p>
          {wishlist?.contact_info && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <strong>Contact:</strong> {wishlist.contact_info}
            </p>
          )}
        </div>
        
        <div className="space-y-8 bg-white dark:bg-neutral-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Classroom Needs ({items.length} items)</h3>
            <div className="hidden md:flex items-center space-x-2">
              <Tooltip text="List View">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-sky-600 text-white hover:bg-sky-800'
                      : 'bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-neutral-500'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </Tooltip>
              <Tooltip text="Grid View">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-sky-600 text-white hover:bg-sky-800'
                      : 'bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-neutral-500'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
              </Tooltip>
            </div>
          </div>
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {items.length > 0 ? items.map(item => (
              <div key={item.$id} className="bg-white dark:bg-neutral-800 rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col justify-between w-full">
                <div>
                  <div className="mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{item.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 w-full">
                  <div className="flex items-center justify-between mb-4">
                    {item.cost && <span className="text-green-600 dark:text-green-400 font-medium text-lg">{item.cost}</span>}
                    <span className="text-blue-600 dark:text-blue-400 flex items-center text-sm">
                      <Gift className="w-4 h-4 mr-1" />
                      {item.contributions} contributions
                    </span>
                  </div>
                  <div className="flex gap-2 w-full justify-between">
                    <div className="flex-none">
                      <Tooltip text="Opens in a new tab">
                        <a
                          href={item.store_link || '#'}
                          target={item.store_link ? "_blank" : undefined}
                          rel={item.store_link ? "noopener noreferrer" : undefined}
                          className={`${item.store_link ? 'bg-green-600 hover:bg-green-800' : 'bg-gray-400 cursor-not-allowed'} text-white px-12 xs:px-6 py-2 rounded-lg transition duration-200 flex items-center justify-center text-sm font-medium`}
                        >
                          <span className="hidden xs:inline">Purchase</span> <ExternalLink className="w-4 h-4 xs:ml-2" />
                        </a>
                      </Tooltip>
                    </div>
                    <div className="flex-none">
                      <Tooltip text="Let the teacher know you've purchased this item">
                        <button
                          onClick={() => handleMarkContribution(item)}
                          className="bg-sky-600 text-white px-12 xs:px-6 py-2 rounded-lg hover:bg-sky-800 transition duration-200 flex items-center justify-center text-sm font-medium"
                        >
                          <CheckCircle className="w-4 h-4 xs:mr-2" />
                          <span className="hidden xs:inline">I bought this</span>
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 bg-white dark:bg-neutral-800 rounded-lg shadow">
                <p className="text-gray-600 dark:text-gray-400">This wiSHlist is empty!</p>
              </div>
            )}
          </div>

          <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow transition-all duration-500 ${submissionSuccess ? 'border-2 border-purple-500' : 'border-2 border-transparent'}`}>
            <div className={`rounded-lg p-6 transition-colors duration-500 ${submissionSuccess ? 'bg-purple-100/30 dark:bg-purple-900/30' : ''}`}>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Suggest a New Item</h3>
              <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                <input type="text" name="itemName" placeholder="Item Name" value={suggestionForm.itemName} onChange={handleSuggestionFormChange} className="w-full p-2 rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" required />
                <textarea name="description" placeholder="Description" value={suggestionForm.description} onChange={handleSuggestionFormChange} className="w-full p-2 rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" />
                <input type="url" name="storeLink" placeholder="Store Link (optional)" value={suggestionForm.storeLink} onChange={handleSuggestionFormChange} className="w-full p-2 rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" />
                <input type="text" name="estimatedCost" placeholder="Estimated Cost (e.g., $15.00)" value={suggestionForm.estimatedCost} onChange={handleSuggestionFormChange} className="w-full p-2 rounded bg-white dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" />
                <button type="submit" className="w-full bg-purple-700 text-white py-2 px-4 rounded-lg hover:bg-purple-900">{submitButtonText}</button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
