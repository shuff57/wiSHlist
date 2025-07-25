import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { account, databases, databaseId, wishlistsCollectionId, itemsCollectionId, suggestionsCollectionId } from '../../appwriteConfig';
import { Models, ID, Query } from 'appwrite';
import { Heart, Trash2, ArrowLeft, Check, X } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';

interface WishlistDoc {
  wishlist_name?: string;
  contact_info?: string;
  wishlist_key: string;
}

interface ItemDoc {
  name: string;
  description?: string;
  store_link?: string;
  cost?: string;
  contributions: number;
}

interface SuggestionDoc {
  itemName: string;
  description?: string;
  storeLink?: string;
  estimatedCost?: string;
  requestedBy: string;
}

export const WishlistEditView: React.FC = () => {
  const { wishlistId } = useParams<{ wishlistId: string }>();
  const [wishlist, setWishlist] = useState<Models.Document & WishlistDoc | null>(null);
  const [items, setItems] = useState<(Models.Document & ItemDoc)[]>([]);
  const [suggestions, setSuggestions] = useState<(Models.Document & SuggestionDoc)[]>([]);
  const [formData, setFormData] = useState({ wishlist_name: '', contact_info: '' });
  const [newItem, setNewItem] = useState({ name: '', description: '', store_link: '', cost: '' });
  const [loading, setLoading] = useState(true);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCopy = (textToCopy: string, type: 'key' | 'link') => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedItem(type);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const fetchWishlistData = useCallback(async (id: string) => {
    try {
      const wishlistDoc = await databases.getDocument(databaseId, wishlistsCollectionId, id);
      setWishlist(wishlistDoc as Models.Document & WishlistDoc);
      setFormData({
        wishlist_name: wishlistDoc.wishlist_name || '',
        contact_info: wishlistDoc.contact_info || ''
      });

      const itemsResponse = await databases.listDocuments(databaseId, itemsCollectionId, [Query.equal('wishlist_id', id)]);
      setItems(itemsResponse.documents as (Models.Document & ItemDoc)[]);

      const suggestionsResponse = await databases.listDocuments(databaseId, suggestionsCollectionId, [Query.equal('wishlist_id', id)]);
      setSuggestions(suggestionsResponse.documents as (Models.Document & SuggestionDoc)[]);

    } catch (error) {
      console.error("Failed to fetch wishlist data:", error);
      navigate('/dashboard');
    }
  }, [navigate]);

  useEffect(() => {
    if (!wishlistId) {
      navigate('/dashboard');
      return;
    }
    const checkUser = async () => {
      try {
        await account.get();
        await fetchWishlistData(wishlistId);
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, [wishlistId, navigate, fetchWishlistData]);

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlist) return;
    try {
      await databases.updateDocument(databaseId, wishlistsCollectionId, wishlist.$id, formData);
      setWishlist(prev => prev ? { ...prev, ...formData } : null);
      alert('Wishlist settings saved!');
    } catch (error) {
      console.error("Error saving settings:", error);
      alert('Failed to save settings.');
    }
  };

  const handleItemFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlist) return;
    try {
      const newItemDoc = await databases.createDocument(databaseId, itemsCollectionId, ID.unique(), {
        wishlist_id: wishlist.$id,
        ...newItem,
        contributions: 0
      });
      setItems(prev => [...prev, newItemDoc as Models.Document & ItemDoc]);
      setNewItem({ name: '', description: '', store_link: '', cost: '' });
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await databases.deleteDocument(databaseId, itemsCollectionId, itemId);
      setItems(prev => prev.filter(item => item.$id !== itemId));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleApproveSuggestion = async (suggestion: Models.Document & SuggestionDoc) => {
    if (!wishlist) return;
    try {
      const newItemDoc = await databases.createDocument(databaseId, itemsCollectionId, ID.unique(), {
        wishlist_id: wishlist.$id,
        name: suggestion.itemName,
        description: suggestion.description,
        store_link: suggestion.storeLink,
        cost: suggestion.estimatedCost,
        contributions: 0
      });
      setItems(prev => [...prev, newItemDoc as Models.Document & ItemDoc]);
      await databases.deleteDocument(databaseId, suggestionsCollectionId, suggestion.$id);
      setSuggestions(prev => prev.filter(s => s.$id !== suggestion.$id));
    } catch (error) {
      console.error("Error approving suggestion:", error);
    }
  };

  const handleDeclineSuggestion = async (suggestionId: string) => {
    try {
      await databases.deleteDocument(databaseId, suggestionsCollectionId, suggestionId);
      setSuggestions(prev => prev.filter(s => s.$id !== suggestionId));
    } catch (error) {
      console.error("Error declining suggestion:", error);
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Heart className="w-8 h-8 text-red-500" />
              <h1 className="text-xl font-bold text-gray-800">Manage Wishlist</h1>
            </div>
            <button onClick={() => navigate('/dashboard')} className="text-blue-600 hover:underline flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Item</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <input type="text" name="name" placeholder="Item Name" value={newItem.name} onChange={handleItemFormChange} className="w-full p-2 border rounded" required />
              <textarea name="description" placeholder="Description" value={newItem.description} onChange={handleItemFormChange} className="w-full p-2 border rounded" />
              <input type="url" name="store_link" placeholder="Store Link (optional)" value={newItem.store_link} onChange={handleItemFormChange} className="w-full p-2 border rounded" />
              <input type="text" name="cost" placeholder="Cost (e.g., $12.99)" value={newItem.cost} onChange={handleItemFormChange} className="w-full p-2 border rounded" />
              <button type="submit" className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">Add to Wishlist</button>
            </form>
          </div>

          {suggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Suggestions ({suggestions.length})</h3>
              <div className="space-y-4">
                {suggestions.map(suggestion => (
                  <div key={suggestion.$id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900">{suggestion.itemName}</h4>
                        {suggestion.description && <p className="text-gray-600 text-sm mt-1">{suggestion.description}</p>}
                        <div className="flex items-center space-x-4 text-sm mt-2">
                          {suggestion.estimatedCost && <span className="text-green-600 font-medium">{suggestion.estimatedCost}</span>}
                          {suggestion.storeLink && <a href={suggestion.storeLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Item</a>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Tooltip text="Approve Suggestion">
                          <button onClick={() => handleApproveSuggestion(suggestion)} className="p-2 text-green-600 hover:text-green-800 bg-green-100 rounded-full"><Check size={20} /></button>
                        </Tooltip>
                        <Tooltip text="Decline Suggestion">
                          <button onClick={() => handleDeclineSuggestion(suggestion.$id)} className="p-2 text-red-600 hover:text-red-800 bg-red-100 rounded-full"><X size={20} /></button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Your Items ({items.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {items.map(item => (
                <div key={item.$id} className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      {item.cost && <span className="text-green-600 font-medium">{item.cost}</span>}
                      {item.store_link && <a href={item.store_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Item</a>}
                    </div>
                    <Tooltip text="Permanently delete this item">
                      <button onClick={() => handleDeleteItem(item.$id)} className="mt-4 w-full text-red-500 hover:text-red-700 text-sm flex items-center justify-center">
                        <Trash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Wishlist Settings</h3>
            <form onSubmit={handleSettingsSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Wishlist Name</label>
                <input type="text" value={formData.wishlist_name} onChange={e => setFormData({...formData, wishlist_name: e.target.value})} className="mt-1 w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Info</label>
                <input type="text" value={formData.contact_info} onChange={e => setFormData({...formData, contact_info: e.target.value})} className="mt-1 w-full p-2 border rounded" />
              </div>
              <Tooltip text="Save changes to your wishlist settings">
                <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">Save Settings</button>
              </Tooltip>
            </form>
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700">Share Key</h4>
              <div className="mt-1 flex items-center space-x-2">
                <input type="text" readOnly value={wishlist?.wishlist_key || ''} className="w-full text-sm bg-gray-100 p-1 border rounded" />
                <Tooltip text="Copy share key">
                  <button 
                    onClick={() => handleCopy(wishlist?.wishlist_key || '', 'key')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${copiedItem === 'key' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {copiedItem === 'key' ? <Check className="w-4 h-4" /> : 'Copy'}
                  </button>
                </Tooltip>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Share Link</h4>
              <div className="mt-1 flex items-center space-x-2">
                <input type="text" readOnly value={`${window.location.origin}/wishlist/${wishlist?.wishlist_key}`} className="w-full text-sm bg-gray-100 p-1 border rounded" />
                <Tooltip text="Copy share link">
                  <button 
                    onClick={() => handleCopy(`${window.location.origin}/wishlist/${wishlist?.wishlist_key}`, 'link')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${copiedItem === 'link' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {copiedItem === 'link' ? <Check className="w-4 h-4" /> : 'Copy'}
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};