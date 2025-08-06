import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databases, databaseId, wishlistsCollectionId, itemsCollectionId, suggestionsCollectionId, urlCacheCollectionId } from '../../appwriteConfig';
import { Models, Query, ID } from 'appwrite';
import { ExternalLink, Gift, CheckCircle, Grid, List, Zap, Edit } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { HoverCard } from '../common/HoverCard';
import { Header } from '../layout/Header';
import { AddItemAuto } from '../teacher/AddItemAuto';
import { AddItemManual } from '../teacher/AddItemManual';

interface WishlistDoc {
  teacher_name: string;
  wishlist_key: string;
  wishlist_name?: string;
  contact_info?: string;
  shipping_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_info?: string;
  title_text?: string;
  welcome_message?: string;
}

interface ItemDoc {
  name: string;
  description?: string;
  store_link?: string;
  cost?: string;
  image_url?: string;
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
  const [addItemMode, setAddItemMode] = useState<'manual' | 'auto'>('auto');
  const [items, setItems] = useState<(Models.Document & ItemDoc)[]>([]);
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


  // Handler for AddItemAuto/AddItemManual to submit as suggestion (pending approval)
  const handleSuggestionAdded = async (item: any) => {
    if (!wishlist) return;
    try {
      // Create suggestion document
      await databases.createDocument(
        databaseId,
        suggestionsCollectionId,
        ID.unique(),
        {
          wishlist_id: wishlist.$id,
          name: item.name || item.item_name || '',
          description: item.description || '',
          cost: item.cost || item.estimatedCost || '',
          store_link: item.store_link || item.storeLink || '',
          image_url: item.image_url || '',
          status: 'pending',
          requestedBy: 'Anonymous',
        }
      );

      // Upsert into url-cache collection if a store_link is present
      if (item.store_link || item.storeLink) {
        const url = item.store_link || item.storeLink;
        const normalizedUrl = url.trim().toLowerCase();
        const urlHash = btoa(normalizedUrl); // Simple hash, replace with better if needed
        const now = Date.now();
        try {
          await databases.createDocument(
            databaseId,
            urlCacheCollectionId,
            ID.unique(),
            {
              url,
              normalizedUrl,
              productId: '',
              metadata: '',
              timestamp: now,
              hitCount: 1,
              urlHash,
              image_url: item.image_url || '',
              name: item.name || item.item_name || '',
              description: item.description || '',
              aiEnhanced: false,
              searchContext: '',
            }
          );
        } catch (err) {
          // Optionally handle duplicate error or update logic here
        }
      }

      setSubmitButtonText('Submitted for Review');
      setTimeout(() => setSubmitButtonText('Submit Suggestion'), 3000);
      setSubmissionSuccess(true);
      setTimeout(() => setSubmissionSuccess(false), 3000);
    } catch (error) {
      alert('Could not submit suggestion. Please try again.');
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
      <Header title={wishlist?.title_text || "wiSHlist"} showSettingsButton={false} showSignoutButton={false} showSearch={true} showInfoButton={true} isLoading={loading} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="mb-4 bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">{wishlist?.title_text || `Help ${wishlist?.teacher_name}&apos;s Students Learn & Grow`}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">{wishlist?.welcome_message || "Your contributions make a real difference in our classroom. Thank you for supporting education!"}</p>
          </div>
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-6">
            {wishlist?.contact_info && wishlist?.shipping_info && (
              <div className="w-full flex flex-col md:flex-row items-stretch justify-center gap-6">
                <div className="w-full md:w-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow p-6 flex flex-col items-center justify-center h-full min-h-[180px]">
                  <span className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-1">Contact Info:</span>
                  <span className="text-lg text-gray-700 dark:text-gray-200 mb-0">{wishlist.contact_info}</span>
                </div>
                <div className="w-full md:w-1/2 bg-white dark:bg-neutral-800 rounded-lg shadow p-6 flex flex-col items-center justify-center h-full min-h-[180px]">
                  <span className="text-xl text-gray-700 dark:text-gray-200 font-semibold mb-1">Shipping Info:</span>
                  <span className="text-lg text-gray-700 dark:text-gray-200 whitespace-pre-line mb-0">{wishlist.shipping_info}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-8 bg-white dark:bg-neutral-900 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Classroom Needs ({items.length} items)</h3>
              <div className="flex items-center space-x-2">
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
              <div key={item.$id} className={`bg-white dark:bg-neutral-800 rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col justify-between w-full ${viewMode === 'grid' ? 'min-h-[220px]' : 'min-h-[180px]'}`}>
                {viewMode === 'grid' ? (
                  // Grid view with hover card
                  <HoverCard
                    content={
                      <div>
                        <div className="font-bold text-base mb-1 text-gray-900 dark:text-white">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-300">{item.description}</div>
                        )}
                      </div>
                    }
                  >
                    <div className="flex flex-col h-full min-h-[220px]">
                      {/* Centered image */}
                      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden w-full max-w-[160px] mx-auto flex items-center justify-center">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                            <Gift className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      {/* Bottom action bar with price/purchase and contributions/bought buttons */}
                      <div className="flex items-end justify-between pt-2">
                        {/* Price and Purchase button */}
                        <div className="flex flex-col items-start space-y-2">
                          {item.cost ? (
                            <span className="text-green-600 dark:text-green-400 font-medium text-lg">{item.cost}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">No price</span>
                          )}
                          <Tooltip text="Opens in a new tab">
                            <a
                              href={item.store_link || '#'}
                              target={item.store_link ? "_blank" : undefined}
                              rel={item.store_link ? "noopener noreferrer" : undefined}
                              className={`${item.store_link ? 'bg-green-600 hover:bg-green-800' : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded-lg transition duration-200 flex items-center justify-center text-sm font-medium`}
                            >
                              <span className="hidden xs:inline">Purchase</span> <ExternalLink className="w-4 h-4 xs:ml-2" />
                            </a>
                          </Tooltip>
                        </div>
                        {/* Contributions and I bought this button */}
                        <div className="flex flex-col items-end space-y-2">
                          <span className="text-blue-600 dark:text-blue-400 flex items-center text-sm">
                            <Gift className="w-4 h-4 mr-1" />
                            {item.contributions} contributions
                          </span>
                          <Tooltip text="Let the teacher know you've purchased this item">
                            <button
                              onClick={() => handleMarkContribution(item)}
                              className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-800 transition duration-200 flex items-center justify-center text-sm font-medium"
                            >
                              <CheckCircle className="w-4 h-4 xs:mr-2" />
                              <span className="hidden xs:inline">I bought this</span>
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    </div>
                  </HoverCard>
                ) : (
                  // List view - centered content with bottom action bar
                  <div className="flex flex-col h-full min-h-[180px]">
                    {/* Centered image and item details */}
                    <div className="flex items-center justify-center flex-grow py-4">
                      {/* Image */}
                      <div className="flex-shrink-0 mr-6 w-24 h-24">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                            <Gift className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      {/* Item details */}
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{item.name}</h3>
                        {item.description && (
                          <p className="text-base text-gray-600 dark:text-gray-400">{item.description}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Bottom action bar with price/purchase and contributions/bought buttons */}
                    <div className="flex items-end justify-between pt-4">
                      {/* Price and Purchase button */}
                      <div className="flex flex-col items-start space-y-2">
                        {item.cost ? (
                          <span className="text-green-600 dark:text-green-400 font-medium text-lg">{item.cost}</span>
                        ) : (
                          <span className="text-gray-400 text-sm">No price</span>
                        )}
                        <Tooltip text="Opens in a new tab">
                          <a
                            href={item.store_link || '#'}
                            target={item.store_link ? "_blank" : undefined}
                            rel={item.store_link ? "noopener noreferrer" : undefined}
                            className={`${item.store_link ? 'bg-green-600 hover:bg-green-800' : 'bg-gray-400 cursor-not-allowed'} text-white px-4 py-2 rounded-lg transition duration-200 flex items-center justify-center text-sm font-medium`}
                          >
                            <span className="hidden xs:inline">Purchase</span> <ExternalLink className="w-4 h-4 xs:ml-2" />
                          </a>
                        </Tooltip>
                      </div>
                      
                      {/* Contributions and I bought this button */}
                      <div className="flex flex-col items-end space-y-2">
                        <span className="text-blue-600 dark:text-blue-400 flex items-center text-sm">
                          <Gift className="w-4 h-4 mr-1" />
                          {item.contributions} contributions
                        </span>
                        <Tooltip text="Let the teacher know you've purchased this item">
                          <button
                            onClick={() => handleMarkContribution(item)}
                            className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-800 transition duration-200 flex items-center justify-center text-sm font-medium"
                          >
                            <CheckCircle className="w-4 h-4 xs:mr-2" />
                            <span className="hidden xs:inline">I bought this</span>
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-10 bg-white dark:bg-neutral-800 rounded-lg shadow">
                <p className="text-gray-600 dark:text-gray-400">This wiSHlist is empty!</p>
              </div>
            )}
          </div>

          {/* Suggestion Section */}
          <div className="flex flex-col mt-8">
            <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow transition-all duration-500 border-2 ${submissionSuccess ? 'border-purple-500' : 'border-purple-300 dark:border-purple-700'}`}>
              <div className={`rounded-lg p-6 transition-colors duration-500 ${submissionSuccess ? 'bg-purple-100/30 dark:bg-purple-900/30' : ''}`}>
                <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-4">Suggest a New Item</h3>
                {/* Tab Navigation */}
                <div className="flex border-b border-purple-200 dark:border-purple-700 mb-4">
                  <button
                    onClick={() => setAddItemMode('auto')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 text-sm font-medium transition-colors rounded-t-lg ${
                      addItemMode === 'auto'
                        ? 'text-purple-700 dark:text-purple-300 border-b-2 border-purple-500 dark:border-purple-400 bg-purple-100 dark:bg-purple-900'
                        : 'text-purple-400 dark:text-purple-500 hover:text-purple-600 dark:hover:text-purple-300'
                    }`}
                  >
                    <Zap size={18} />
                    <span>Auto (URL)</span>
                  </button>
                  <button
                    onClick={() => setAddItemMode('manual')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 text-sm font-medium transition-colors rounded-t-lg ${
                      addItemMode === 'manual'
                        ? 'text-purple-700 dark:text-purple-300 border-b-2 border-purple-500 dark:border-purple-400 bg-purple-100 dark:bg-purple-900'
                        : 'text-purple-400 dark:text-purple-500 hover:text-purple-600 dark:hover:text-purple-300'
                    }`}
                  >
                    <Edit size={18} />
                    <span>Manual</span>
                  </button>
                </div>
                {/* Tab Content */}
                {addItemMode === 'auto' && wishlist && (
                  <AddItemAuto wishlist={wishlist} onItemAdded={handleSuggestionAdded} suggestionMode />
                )}
                {addItemMode === 'manual' && wishlist && (
                  <AddItemManual wishlist={wishlist} onItemAdded={handleSuggestionAdded} suggestionMode />
                )}
                {submissionSuccess && (
                  <div className="mt-4 text-purple-700 dark:text-purple-300 font-semibold text-center">Suggestion submitted for review!</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
