import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { account, databases, databaseId, wishlistsCollectionId, itemsCollectionId, suggestionsCollectionId } from '../../appwriteConfig';
import { Models, ID, Query } from 'appwrite';
import { Trash2, Check, X, GripVertical, Pencil } from 'lucide-react';
import { ExternalLink } from 'lucide-react';
import { Tooltip } from '../common/Tooltip';
import { Header } from '../layout/Header';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useStrictDroppable } from '../../hooks/useStrictDroppable';

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
  position: number;
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
  const [editedItemData, setEditedItemData] = useState<ItemDoc | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [enabled] = useStrictDroppable(loading);
  const navigate = useNavigate();

  const handleCopy = (textToCopy: string, type: 'key' | 'link') => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedItem(type);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const fetchWishlistData = useCallback(async (id: string) => {
    console.log('Fetching wishlist data for ID:', id);
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
      console.log('No wishlistId found in URL, redirecting to dashboard.');
      navigate('/dashboard');
      return;
    }
    const checkUser = async () => {
      try {
        await account.get();
        await fetchWishlistData(wishlistId);
      } catch (error) {
        console.error('Authentication check failed:', error);
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

  const handleEditItem = (item: Models.Document & ItemDoc) => {
    setEditingItemId(item.$id);
    setEditedItemData(item);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditedItemData(null);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedItemData || !editingItemId) return;
    try {
      const updatedItem = await databases.updateDocument(
        databaseId,
        itemsCollectionId,
        editingItemId,
        {
          name: editedItemData.name,
          description: editedItemData.description,
          store_link: editedItemData.store_link,
          cost: editedItemData.cost,
        }
      );
      setItems(prev => prev.map(i => i.$id === editingItemId ? updatedItem as Models.Document & ItemDoc : i));
      handleCancelEdit();
    } catch (error) {
      console.error("Error updating item:", error);
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

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(source.index, 1);
    reorderedItems.splice(destination.index, 0, removed);

    setItems(reorderedItems);

    // Optionally, update the order in your database if you add a position field in the future
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-gray-800 dark:text-gray-200">
      <Header title="Manage wiSHlist" showBackButton={true} isLoading={loading} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Add New Item</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <input type="text" name="name" placeholder="Item Name" value={newItem.name} onChange={handleItemFormChange} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none" required />
              <textarea name="description" placeholder="Description" value={newItem.description} onChange={handleItemFormChange} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none" />
              <input type="url" name="store_link" placeholder="Store Link (optional)" value={newItem.store_link} onChange={handleItemFormChange} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" />
              <input type="text" name="cost" placeholder="Cost (e.g., $12.99)" value={newItem.cost} onChange={handleItemFormChange} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" />
              <button type="submit" className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-900">Add to wiSHlist</button>
            </form>
          </div>

          {suggestions.length > 0 && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Pending Suggestions ({suggestions.length})</h3>
              <div className="space-y-4">
                {suggestions.map(suggestion => (
                  <div key={suggestion.$id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-200">{suggestion.itemName}</h4>
                        {suggestion.description && <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{suggestion.description}</p>}
                        <div className="flex items-center space-x-4 text-sm mt-2">
                          {suggestion.estimatedCost && <span className="text-green-600 font-medium">{suggestion.estimatedCost}</span>}
                          {suggestion.storeLink && <a href={suggestion.storeLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Item</a>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Tooltip text="Approve Suggestion">
                          <button onClick={() => handleApproveSuggestion(suggestion)} className="p-2 text-green-600 hover:text-green-800 bg-green-200 dark:bg-green-700 dark:hover:bg-green-800 rounded-full"><Check size={20} /></button>
                        </Tooltip>
                        <Tooltip text="Decline Suggestion">
                          <button onClick={() => handleDeclineSuggestion(suggestion.$id)} className="p-2 text-red-600 hover:text-red-800 bg-red-200 dark:bg-red-700 dark:hover:bg-red-800 rounded-full"><X size={20} /></button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4">Your Items ({items.length})</h3>
            <DragDropContext onDragEnd={onDragEnd}>
              {enabled && (
                <Droppable droppableId="wishlist-items">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 gap-6">
                      {items.map((item, index) => (
                        <Draggable key={item.$id} draggableId={item.$id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 flex flex-col justify-between transition-colors duration-200 group pointer-events-none"
                            >
                              {editingItemId === item.$id ? (
                                <form onSubmit={handleUpdateItem} className="space-y-4">
                                  <input type="text" name="name" value={editedItemData?.name || ''} onChange={(e) => setEditedItemData(prev => ({ ...prev!, name: e.target.value }))} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none" required />
                                  <textarea name="description" value={editedItemData?.description || ''} onChange={(e) => setEditedItemData(prev => ({ ...prev!, description: e.target.value }))} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none" />
                                  <input type="url" name="store_link" value={editedItemData?.store_link || ''} onChange={(e) => setEditedItemData(prev => ({ ...prev!, store_link: e.target.value }))} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" />
                                  <input type="text" name="cost" value={editedItemData?.cost || ''} onChange={(e) => setEditedItemData(prev => ({ ...prev!, cost: e.target.value }))} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" />
                                  <div className="flex space-x-2">
                                    <button type="submit" className="flex-grow bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-900">Save</button>
                                    <button type="button" onClick={handleCancelEdit} className="flex-grow bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400">Cancel</button>
                                  </div>
                                </form>
                              ) : (
                                <>
                                  <div className="flex items-center">
                                    <div {...provided.dragHandleProps} className="p-2 cursor-grab active:cursor-grabbing pointer-events-auto">
                                      <GripVertical className="w-5 h-5 text-black dark:text-white" />
                                    </div>
                                    <div className="flex-grow">
                                      <h4 className="font-semibold text-gray-900 dark:text-gray-200">{item.name}</h4>
                                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{item.description}</p>
                                      {item.cost && <span className="text-green-600 font-medium text-sm">{item.cost}</span>}
                                    </div>
                                    <div className="flex flex-col items-end space-y-2 ml-4">
                                      {item.store_link && (
                                        <Tooltip text="View this item">
                                          <a
                                            href={item.store_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer pointer-events-auto"
                                          >
                                            <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                          </a>
                                        </Tooltip>
                                      )}
                                      <Tooltip text="Edit this item">
                                        <button onClick={() => handleEditItem(item)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer pointer-events-auto">
                                          <Pencil className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                        </button>
                                      </Tooltip>
                                      <Tooltip text="Delete this item">
                                        <button onClick={() => handleDeleteItem(item.$id)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer pointer-events-auto">
                                          <Trash2 className="w-5 h-5 text-red-600" />
                                        </button>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </DragDropContext>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">wiSHlist Settings</h3>
            <form onSubmit={handleSettingsSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">wiSHlist Name</label>
              <input type="text" value={formData.wishlist_name} onChange={e => setFormData({...formData, wishlist_name: e.target.value})} className="mt-1 w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contact Info</label>
                <input type="text" value={formData.contact_info} onChange={e => setFormData({...formData, contact_info: e.target.value})} className="mt-1 w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" />
              </div>
              <Tooltip text="Save changes to your wishlist settings">
                <button type="submit" className="w-full bg-sky-600 text-white py-2 px-4 rounded-lg hover:bg-sky-800 dark:hover:bg-sky-800">Save Settings</button>
              </Tooltip>
            </form>
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Share Key</h4>
              <div className="mt-1 flex items-center space-x-2">
                <input type="text" readOnly value={wishlist?.wishlist_key || ''} className="w-full text-sm bg-gray-100 dark:bg-neutral-700 p-1 rounded text-gray-900 dark:text-gray-200 focus:outline-none" />
                <Tooltip text="Copy share key">
                  <button 
                    onClick={() => handleCopy(wishlist?.wishlist_key || '', 'key')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${copiedItem === 'key' ? 'bg-green-600 text-white' : 'bg-sky-600 text-white hover:bg-sky-800'}`}
                  >
                    {copiedItem === 'key' ? <Check className="w-4 h-4" /> : 'Copy'}
                  </button>
                </Tooltip>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Share Link</h4>
              <div className="mt-1 flex items-center space-x-2">
                                <input type="text" readOnly value={`${window.location.origin}/wishlist/${wishlist?.wishlist_key}`} className="w-full text-sm bg-gray-100 dark:bg-neutral-700 p-1 rounded text-gray-900 dark:text-gray-200 focus:outline-none" />
                <Tooltip text="Copy share link">
                  <button 
                    onClick={() => handleCopy(`${window.location.origin}/wishlist/${wishlist?.wishlist_key}`, 'link')}
                    className={`px-3 py-1 text-sm rounded transition-colors ${copiedItem === 'link' ? 'bg-green-600 text-white' : 'bg-sky-600 text-white hover:bg-sky-800'}`}
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