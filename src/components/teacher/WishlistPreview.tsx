import React, { useState, useEffect, useCallback } from 'react';
import { databases, databaseId, wishlistsCollectionId, itemsCollectionId } from '../../appwriteConfig';
import { Models, Query } from 'appwrite';
import { ExternalLink, Gift, CheckCircle, Grid, List, Pencil } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';

interface WishlistPreviewProps {
  wishlistKey: string;
  editable?: boolean; // If true, show pencil icons and allow editing
  userName?: string; // Optional user name for default heading
}

interface WishlistDoc {
  teacher_name: string;
  wishlist_name?: string;
  contact_info?: string;
}


export const WishlistPreview: React.FC<WishlistPreviewProps> = ({ wishlistKey, editable, userName }) => {
  interface ItemDoc {
    name: string;
    description?: string;
    store_link?: string;
    cost?: string;
    contributions: number;
  }

  const [wishlist, setWishlist] = useState<Models.Document & WishlistDoc | null>(null);
  const [items, setItems] = useState<(Models.Document & ItemDoc)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingField, setEditingField] = useState<null | 'heading' | 'welcome'>(null);
  const [tempHeading, setTempHeading] = useState('');
  const [tempWelcome, setTempWelcome] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchWishlistData = useCallback(async (key: string) => {
    const processedKey = key.trim();
    setError('');
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
        setError('No wishlist found with that key. Please check the key and try again.');
      }
    } catch (err: any) {
      console.error("Error fetching wishlist:", err);
      setError(`Failed to fetch wishlist: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (wishlistKey) {
      fetchWishlistData(wishlistKey);
    }
  }, [wishlistKey, fetchWishlistData]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-gray-700 dark:text-gray-300 mt-4">{error}</p>
      </div>
    );
  }


  // Use new attributes if present, fallback to userName or teacher_name, then generic
  const heading = wishlist?.title_text
    || (userName ? `Help ${userName}'s Students Learn & Grow`
    : wishlist ? `Help ${wishlist.teacher_name}'s Students Learn & Grow`
    : 'Help Students Learn & Grow');
  const welcome = wishlist?.welcome_message || 'Your contributions make a real difference in our classroom. Thank you for supporting education!';

  // Save handler
  const handleSave = async () => {
    if (!wishlist) return;
    setSaving(true);
    try {
      const updatedDoc = await databases.updateDocument(
        databaseId,
        wishlistsCollectionId,
        wishlist.$id,
        {
          title_text: editingField === 'heading' ? tempHeading : wishlist.title_text,
          welcome_message: editingField === 'welcome' ? tempWelcome : wishlist.welcome_message,
        }
      );
      setWishlist(updatedDoc as Models.Document & WishlistDoc);
      setEditingField(null);
    } catch (err) {
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          {/* Editable Heading */}
          {editingField === 'heading' ? (
            <div className="flex flex-col items-center mb-2">
              <input
                className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 w-full max-w-xl"
                value={tempHeading}
                onChange={e => setTempHeading(e.target.value)}
                disabled={saving}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSave} disabled={saving || !tempHeading.trim()} className="px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-800 disabled:bg-gray-400">Save</button>
                <button onClick={() => setEditingField(null)} disabled={saving} className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center mb-2">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{heading}</h2>
              {wishlist && (typeof editable !== 'undefined' && editable) && (
                <button
                  className="ml-2 p-1 text-gray-500 hover:text-sky-600"
                  onClick={() => {
                    setEditingField('heading');
                    setTempHeading(heading);
                  }}
                  title="Edit heading"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Editable Welcome Message */}
          {editingField === 'welcome' ? (
            <div className="flex flex-col items-center mb-2">
              <textarea
                className="text-gray-600 dark:text-gray-400 mb-2 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-neutral-800 w-full max-w-xl"
                value={tempWelcome}
                onChange={e => setTempWelcome(e.target.value)}
                rows={3}
                disabled={saving}
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSave} disabled={saving || !tempWelcome.trim()} className="px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-800 disabled:bg-gray-400">Save</button>
                <button onClick={() => setEditingField(null)} disabled={saving} className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <p className="text-gray-600 dark:text-gray-400">{welcome}</p>
              {wishlist && (typeof editable !== 'undefined' && editable) && (
                <button
                  className="ml-2 p-1 text-gray-500 hover:text-sky-600"
                  onClick={() => {
                    setEditingField('welcome');
                    setTempWelcome(welcome);
                  }}
                  title="Edit welcome message"
                >
                  <Pencil className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {wishlist?.contact_info && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              <strong>Contact:</strong> {wishlist.contact_info}
            </p>
          )}
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
              <div key={item.$id} className="bg-white dark:bg-neutral-800 rounded-lg shadow hover:shadow-md transition-shadow p-6 flex flex-col justify-between w-full">
                <div>
                  <div className="mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">{item.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    {item.cost && <span className="text-green-600 dark:text-green-400 font-medium text-lg">{item.cost}</span>}
                    <span className="text-blue-600 dark:text-blue-400 flex items-center text-sm">
                      <Gift className="w-4 h-4 mr-1" />
                      {item.contributions} contributions
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    {item.store_link ? (
                      <Tooltip text="Opens in a new tab">
                        <a
                          href={item.store_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-sky-600 text-white px-6 py-2 rounded-lg hover:bg-sky-800 transition duration-200 flex items-center justify-center text-sm font-medium"
                        >
                          Purchase <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Tooltip>
                    ) : (
                      <div></div>
                    )}
                    <Tooltip text="Let the teacher know you've purchased this item">
                      <button
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
              <div className="text-center py-10 bg-white dark:bg-neutral-800 rounded-lg shadow">
                <p className="text-gray-600 dark:text-gray-400">This wiSHlist is empty!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};