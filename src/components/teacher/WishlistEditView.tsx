import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { account, databases, databaseId, wishlistsCollectionId, itemsCollectionId, suggestionsCollectionId } from '../../appwriteConfig';
import { Models, ID, Query } from 'appwrite';
import { Trash2, Check, X, GripVertical, Pencil, Grid, List, Save, Copy, Plus, Zap, Edit, Gift } from 'lucide-react';
import { ExternalLink } from 'lucide-react';
import { HoverCard } from '../common/HoverCard';
import { Tooltip } from '../common/Tooltip';
import { Header } from '../layout/Header';
import { GoogleAddressAutocomplete } from '../common/GoogleAddressAutocomplete';
import { UrlPreview } from '../common/UrlPreview';
import { ItemCard } from '../common/ItemCard';
import { useUrlPreview } from '../../hooks/useUrlPreview';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useStrictDroppable } from '../../hooks/useStrictDroppable';
import { AddItemManual } from './AddItemManual';
import { AddItemAuto } from './AddItemAuto';

interface WishlistDoc {
  wishlist_name?: string;
  contact_info?: string;
  wishlist_key: string;
  shipping_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_info?: string;
}

interface ItemDoc {
  name: string;
  description?: string;
  store_link?: string;
  cost?: string;
  image_url?: string;
  contributions: number;
  position: number;
}

interface SuggestionDoc {
  name: string;
  description?: string;
  cost?: string;
  store_link?: string;
  image_url?: string;
  requestedBy: string;
}

// Item URL Preview Component
const ItemUrlPreview: React.FC<{ url: string }> = ({ url }) => {
  const itemPreview = useUrlPreview();
  
  useEffect(() => {
    if (url && url.trim().startsWith('http')) {
      itemPreview.previewUrl(url);
    }
    return () => {
      itemPreview.clearPreview();
    };
  }, [url]);
  
  if (!itemPreview.data && !itemPreview.loading && !itemPreview.error) {
    return null;
  }
  
  return (
    <UrlPreview
      data={itemPreview.data}
      loading={itemPreview.loading}
      error={itemPreview.error}
      className="border-l-4 border-blue-500 pl-3"
    />
  );
};

export const WishlistEditView: React.FC = () => {
  const [showShippingConfirmation, setShowShippingConfirmation] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const { wishlistId } = useParams<{ wishlistId: string }>();
  const [wishlist, setWishlist] = useState<Models.Document & WishlistDoc | null>(null);
  const [items, setItems] = useState<(Models.Document & ItemDoc)[]>([]);
  const [suggestions, setSuggestions] = useState<(Models.Document & SuggestionDoc)[]>([]);
  const [formData, setFormData] = useState({ 
    wishlist_name: '', 
    contact_info: '',
    shipping_name: '',
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: ''
  });
  const [loading, setLoading] = useState(true);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [editedItemData, setEditedItemData] = useState<ItemDoc | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('wishlistViewMode') as 'list' | 'grid') || 'list';
    }
    return 'list';
  });
  const [enabled] = useStrictDroppable(loading);
  const [isClient, setIsClient] = useState(false);
  
  // Add Item Mode - 'manual' or 'auto'
  const [addItemMode, setAddItemMode] = useState<'manual' | 'auto'>('auto');
  const [isAddItemExpanded, setIsAddItemExpanded] = useState(true);
  
  // URL Preview functionality for editing items
  const editItemPreview = useUrlPreview();
  const [urlPreviewTimeout, setUrlPreviewTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const navigate = useNavigate();

  // Ensure client-side rendering for drag-and-drop
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wishlistViewMode', viewMode);
    }
  }, [viewMode]);

  // Cleanup URL preview timeout on unmount
  useEffect(() => {
    return () => {
      if (urlPreviewTimeout) {
        clearTimeout(urlPreviewTimeout);
      }
    };
  }, [urlPreviewTimeout]);

  const handleCopy = (textToCopy: string, type: 'key' | 'link') => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedItem(type);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const fetchWishlistData = useCallback(async (id: string) => {
    try {
      const wishlistDoc = await databases.getDocument(databaseId, wishlistsCollectionId, id);
      setWishlist(wishlistDoc as unknown as Models.Document & WishlistDoc);
      setFormData({
        wishlist_name: wishlistDoc.wishlist_name || '',
        contact_info: wishlistDoc.contact_info || '',
        shipping_name: wishlistDoc.shipping_name || '',
        shipping_address: wishlistDoc.shipping_address || '',
        shipping_city: wishlistDoc.shipping_city || '',
        shipping_state: wishlistDoc.shipping_state || '',
        shipping_zip: wishlistDoc.shipping_zip || ''
      });

      const itemsResponse = await databases.listDocuments(
        databaseId,
        itemsCollectionId,
        [
          Query.equal('wishlist_id', id),
          Query.orderAsc('position')
        ]
      );
      setItems(itemsResponse.documents as unknown as (Models.Document & ItemDoc)[]);

      const suggestionsResponse = await databases.listDocuments(databaseId, suggestionsCollectionId, [Query.equal('wishlist_id', id)]);
      setSuggestions(suggestionsResponse.documents as unknown as (Models.Document & SuggestionDoc)[]);

      sessionStorage.setItem('lastVisitedWishlist', wishlistDoc.wishlist_key);
    } catch (error) {
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
      await databases.updateDocument(databaseId, wishlistsCollectionId, wishlist.$id, {
        wishlist_name: formData.wishlist_name,
        contact_info: formData.contact_info
      });
      setWishlist(prev => prev ? { ...prev, wishlist_name: formData.wishlist_name, contact_info: formData.contact_info } : null);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3500);
    } catch (error) {
      alert('Failed to save settings.');
    }
  };

  const handleItemFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Removed - now handled by individual components
  };

  // Handle applying scraped data to form
  const handleApplyPreviewData = (previewData: any) => {
    // Removed - now handled by AddItemAuto component
  };

  const handleAddItem = async (e: React.FormEvent) => {
    // Removed - now handled by individual components
  };

  // Handle item added callback
  const handleItemAdded = (newItem: Models.Document & ItemDoc) => {
    setItems(prev => [...prev, newItem]);
  };

  const handleEditItem = (item: Models.Document & ItemDoc) => {
    setEditingItemId(item.$id);
    setEditedItemData(item);
    editItemPreview.clearPreview();
    // Auto-preview existing URL if present
    if (item.store_link && item.store_link.trim().startsWith('http')) {
      setTimeout(() => {
        editItemPreview.previewUrl(item.store_link!);
      }, 100);
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditedItemData(null);
    editItemPreview.clearPreview();
  };

  // Handle edit form changes with URL preview
  const handleEditItemChange = (field: keyof ItemDoc, value: string) => {
    setEditedItemData(prev => ({ ...prev!, [field]: value }));
    
    // Auto-preview URL when store_link changes
    if (field === 'store_link' && value.trim()) {
      if (urlPreviewTimeout) {
        clearTimeout(urlPreviewTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (value.trim().startsWith('http')) {
          editItemPreview.previewUrl(value.trim());
        }
      }, 1000);
      
      setUrlPreviewTimeout(timeout);
    } else if (field === 'store_link' && !value.trim()) {
      editItemPreview.clearPreview();
      if (urlPreviewTimeout) {
        clearTimeout(urlPreviewTimeout);
      }
    }
  };

  // Handle applying scraped data to edit form
  const handleApplyEditPreviewData = (previewData: any) => {
    setEditedItemData(prev => ({
      ...prev!,
      name: previewData.title || prev!.name,
      description: previewData.description || prev!.description,
      cost: previewData.price || prev!.cost
    }));
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
      setItems(prev => prev.map(i => i.$id === editingItemId ? updatedItem as unknown as Models.Document & ItemDoc : i));
      handleCancelEdit();
    } catch (error) {
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await databases.deleteDocument(databaseId, itemsCollectionId, itemId);
      setItems(prev => prev.filter(item => item.$id !== itemId));
    } catch (error) {
    }
  };

  const handleDuplicateItem = async (item: Models.Document & ItemDoc) => {
    if (!wishlist) return;
    console.log('Duplicating item:', item.name);
    try {
      // Simple duplicate naming - just append (copy) each time to match wishlist duplication
      const newName = `${item.name}(copy)`;
      
      const duplicatedItemDoc = await databases.createDocument(databaseId, itemsCollectionId, ID.unique(), {
        wishlist_id: wishlist.$id,
        name: newName,
        description: item.description,
        store_link: item.store_link,
        cost: item.cost,
        image_url: item.image_url || '',
        contributions: 0 // Reset contributions for the duplicate
      });
      setItems(prev => [...prev, duplicatedItemDoc as unknown as Models.Document & ItemDoc]);
      console.log('Item duplicated successfully:', newName);
    } catch (error) {
      console.error('Error duplicating item:', error);
      alert('Failed to duplicate item. Please try again.');
    }
  };

  const handleApproveSuggestion = async (suggestion: Models.Document & SuggestionDoc) => {
    if (!wishlist) return;
    try {
      const newItemDoc = await databases.createDocument(databaseId, itemsCollectionId, ID.unique(), {
        wishlist_id: wishlist.$id,
        name: suggestion.name,
        description: suggestion.description || '',
        store_link: suggestion.store_link,
        cost: suggestion.cost,
        image_url: suggestion.image_url || '',
        contributions: 0
      });
      setItems(prev => [...prev, newItemDoc as unknown as Models.Document & ItemDoc]);
      await databases.deleteDocument(databaseId, suggestionsCollectionId, suggestion.$id);
      setSuggestions(prev => prev.filter(s => s.$id !== suggestion.$id));
    } catch (error) {
    }
  };

  const handleDeclineSuggestion = async (suggestionId: string) => {
    try {
      await databases.deleteDocument(databaseId, suggestionsCollectionId, suggestionId);
      setSuggestions(prev => prev.filter(s => s.$id !== suggestionId));
    } catch (error) {
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(source.index, 1);
    reorderedItems.splice(destination.index, 0, removed);

    // Update position field for each item in the new order (sequentially, ensuring DB update)
    (async () => {
      for (let idx = 0; idx < reorderedItems.length; idx++) {
        const item = reorderedItems[idx];
        try {
          await databases.updateDocument(databaseId, itemsCollectionId, item.$id, {
            position: idx
          });
        } catch (error) {
          // Optionally handle error (e.g., show notification)
        }
      }
    })();

    setItems(reorderedItems);
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-gray-800 dark:text-gray-200">
      <Header title="Manage wiSHlist" showBackButton={true} showInfoButton={true} isLoading={loading} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">

        {/* Merged Add New Item (Auto/Manual) section with bg-neutral and no border */}
        <div className="flex flex-col">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow overflow-hidden">
            <div 
              className="px-4 py-2.5 flex items-center min-h-[48px] cursor-pointer group relative"
              onClick={() => setIsAddItemExpanded(prev => !prev)}
            >
              <div className="absolute inset-0 bg-gray-50 dark:bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-lg font-semibold text-sky-600 dark:text-sky-600 relative">
                Add New Item
              </h3>
            </div>
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isAddItemExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-6">
                {/* Tab Navigation */}
                <div className="flex border-b border-neutral-200 dark:border-neutral-700 mb-4 bg-white dark:bg-neutral-900 rounded-t-lg">
                  <button
                    onClick={() => setAddItemMode('auto')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 text-sm font-medium transition-colors rounded-t-lg ${
                      addItemMode === 'auto'
                        ? 'text-sky-600 dark:text-sky-600 border-b-2 border-sky-800 dark:border-sky-800 bg-white dark:bg-neutral-800 hover:text-sky-800 dark:hover:text-sky-800'
                        : 'text-sky-600 dark:text-sky-600 hover:text-sky-800 dark:hover:text-sky-800 bg-white dark:bg-neutral-800'
                    }`}
                  >
                    <Zap size={18} />
                    <span>Auto (URL)</span>
                  </button>
                  <button
                    onClick={() => setAddItemMode('manual')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 text-sm font-medium transition-colors rounded-t-lg ${
                      addItemMode === 'manual'
                        ? 'text-sky-600 dark:text-sky-600 border-b-2 border-sky-800 dark:border-sky-800 bg-white dark:bg-neutral-800 hover:text-sky-800 dark:hover:text-sky-800'
                        : 'text-sky-600 dark:text-sky-600 hover:text-sky-800 dark:hover:text-sky-800 bg-white dark:bg-neutral-800'
                    }`}
                  >
                    <Edit size={18} />
                    <span>Manual</span>
                  </button>
                </div>
                {/* Tab Content */}
                {addItemMode === 'auto' && wishlist && (
                  <AddItemAuto 
                    wishlist={wishlist} 
                    onItemAdded={handleItemAdded} 
                    existingItems={items}
                  />
                )}
                {addItemMode === 'manual' && wishlist && (
                  <AddItemManual wishlist={wishlist} onItemAdded={handleItemAdded} />
                )}
              </div>
            </div>
          </div>
        </div>

          {suggestions.length > 0 && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Pending Suggestions ({suggestions.length})</h3>
              <div className="space-y-4">
                {suggestions.map(suggestion => (
                  <div key={suggestion.$id} className="bg-white dark:bg-neutral-800 border-2 border-amber-500 dark:border-amber-800 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          {suggestion.image_url && (
                            <img src={suggestion.image_url} alt={suggestion.name} className="w-16 h-16 object-cover rounded border" />
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-200 text-lg">{suggestion.name}</h4>
                            {suggestion.description && <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{suggestion.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm mt-2">
                          {suggestion.cost && <span className="text-green-600 font-medium text-lg">{suggestion.cost}</span>}
                          {suggestion.store_link && <a href={suggestion.store_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Item</a>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Tooltip text="Approve Suggestion">
                          <button onClick={() => handleApproveSuggestion(suggestion)} className="p-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 rounded-full"><Check size={20} className="text-white" /></button>
                        </Tooltip>
                        <Tooltip text="Decline Suggestion">
                          <button onClick={() => handleDeclineSuggestion(suggestion.$id)} className="p-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 rounded-full"><X size={20} className="text-white" /></button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Your Items ({items.length})</h3>
              <div className="flex items-center space-x-2">
                <Tooltip text="List View">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-sky-600 text-white hover:bg-sky-800'
                        : 'bg-gray-200 dark:bg-neutral-700 text-gray-600 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-neutral-500'
                    }`}
                    aria-label="List View"
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
                    aria-label="Grid View"
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                </Tooltip>
              </div>
            </div>
            <DragDropContext onDragEnd={onDragEnd}>
              {enabled && isClient && (
                <Droppable droppableId="wishlist-items">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                      {items.map((item, index) => (
                        <Draggable key={item.$id} draggableId={item.$id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 flex flex-col justify-between transition-colors duration-200 group"
                            >
                              {editingItemId === item.$id ? (
                                <form onSubmit={handleUpdateItem} className="space-y-4">
                                  <input type="text" name="name" value={editedItemData?.name || ''} onChange={(e) => handleEditItemChange('name', e.target.value)} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none" required />
                                  <textarea name="description" value={editedItemData?.description || ''} onChange={(e) => handleEditItemChange('description', e.target.value)} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none" />
                                  <div className="space-y-2">
                                    <input type="url" name="store_link" value={editedItemData?.store_link || ''} onChange={(e) => handleEditItemChange('store_link', e.target.value)} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" placeholder="Store Link (paste Amazon, Best Buy, etc.)" />
                                    
                                    {/* URL Preview for edit form */}
                                    {(editItemPreview.loading || editItemPreview.data || editItemPreview.error) && (
                                      <div className="space-y-2">
                                        <UrlPreview 
                                          data={editItemPreview.data}
                                          loading={editItemPreview.loading}
                                          error={editItemPreview.error}
                                          onRetry={() => editItemPreview.previewUrl(editedItemData?.store_link || '')}
                                        />
                                        {editItemPreview.data && (
                                          <div className="flex space-x-2">
                                            <button 
                                              type="button"
                                              onClick={() => handleApplyEditPreviewData(editItemPreview.data)}
                                              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                            >
                                              Use This Info
                                            </button>
                                            <button 
                                              type="button"
                                              onClick={editItemPreview.clearPreview}
                                              className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                            >
                                              Dismiss
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <input type="text" name="cost" value={editedItemData?.cost || ''} onChange={(e) => handleEditItemChange('cost', e.target.value)} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" placeholder="Cost (e.g., $12.99)" />
                                  <div className="flex space-x-2">
                                    <button type="submit" className="flex-grow bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-900">Save</button>
                                    <button type="button" onClick={handleCancelEdit} className="flex-grow bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400">Cancel</button>
                                  </div>
                                </form>
                              ) : (
                                <>
                                  {viewMode === 'grid' ? (
                                    // Compact grid view - all elements inline (drag handle, image, actions)
                                    <div className="flex items-center space-x-3">
                                      {/* Drag handle on left - vertically centered */}
                                      <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                        <GripVertical className="w-5 h-5 text-black dark:text-white" />
                                      </div>
                                      {/* Image and price in center */}
                                      <div className="flex-grow">
                                        <HoverCard
                                    content={
                                      <div className="flex flex-col items-center justify-center">
                                        <div className="font-bold text-base mb-1 text-gray-900 dark:text-white text-center">{item.name}</div>
                                        {item.description && (
                                          <div className="text-sm text-gray-600 dark:text-gray-300 text-center">{item.description}</div>
                                        )}
                                      </div>
                                    }
                                        >
                                          <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden w-full max-w-[160px] mx-auto flex items-center justify-center">
                                            {item.image_url ? (
                                              <img 
                                                src={item.image_url} 
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                                                <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                </svg>
                                              </div>
                                            )}
                                          </div>
                                        </HoverCard>
                                        {/* Price centered below image */}
                                        <div className="text-center">
                                          <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                                            {item.cost || 'No price'}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {/* Action buttons on right */}
                                      <div className="flex flex-col space-y-1">
                                        {item.store_link && (
                                          <Tooltip text="View this item">
                                            <a
                                              href={item.store_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer"
                                            >
                                              <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                            </a>
                                          </Tooltip>
                                        )}
                                        <Tooltip text="Edit this item">
                                          <button onClick={() => handleEditItem(item)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer">
                                            <Pencil className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                          </button>
                                        </Tooltip>
                                        <Tooltip text="Duplicate this item">
                                          <button onClick={() => handleDuplicateItem(item)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer">
                                            <Copy className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                          </button>
                                        </Tooltip>
                                        <Tooltip text="Delete this item">
                                          <button onClick={() => handleDeleteItem(item.$id)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer">
                                            <Trash2 className="w-5 h-5 text-red-600" />
                                          </button>
                                        </Tooltip>
                                      </div>
                                    </div>
                                  ) : (
                                    // List view - item details inline with drag handle and actions
                                    <div className="flex items-center">
                                      <div {...provided.dragHandleProps} className="p-2 cursor-grab active:cursor-grabbing">
                                        <GripVertical className="w-5 h-5 text-black dark:text-white" />
                                      </div>
                                      {/* Image */}
                                      <div className="flex-shrink-0 mr-3">
                                        {item.image_url ? (
                                          <img
                                            src={item.image_url}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded"
                                          />
                                        ) : (
                                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center">
                                            <Gift className="w-6 h-6 text-gray-400" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-grow px-3">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-200 text-lg">{item.name}</h4>
                                        {item.description && (
                                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{item.description}</p>
                                        )}
                                        {item.cost && (
                                          <span className="text-green-600 dark:text-green-400 font-medium text-lg">{item.cost}</span>
                                        )}
                                      </div>
                                      <div className="flex flex-col items-end space-y-2 ml-4">
                                        {item.store_link && (
                                          <Tooltip text="View this item">
                                            <a
                                              href={item.store_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer"
                                            >
                                              <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                            </a>
                                          </Tooltip>
                                        )}
                                        <Tooltip text="Edit this item">
                                          <button onClick={() => handleEditItem(item)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer">
                                            <Pencil className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                          </button>
                                        </Tooltip>
                                        <Tooltip text="Duplicate this item">
                                          <button onClick={() => handleDuplicateItem(item)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer">
                                            <Copy className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                          </button>
                                        </Tooltip>
                                        <Tooltip text="Delete this item">
                                          <button onClick={() => handleDeleteItem(item.$id)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer">
                                            <Trash2 className="w-5 h-5 text-red-600" />
                                          </button>
                                        </Tooltip>
                                      </div>
                                    </div>
                                  )}
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
              {/* Fallback rendering when drag-and-drop is not available */}
              {(!enabled || !isClient) && (
                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  {items.map((item, index) => (
                    <div
                      key={item.$id}
                      className="bg-white dark:bg-neutral-800 rounded-lg shadow p-4 flex flex-col justify-between transition-colors duration-200 group"
                    >
                      {editingItemId === item.$id ? (
                        <form onSubmit={handleUpdateItem} className="space-y-4">
                          <input type="text" name="name" value={editedItemData?.name || ''} onChange={(e) => handleEditItemChange('name', e.target.value)} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none" required />
                          <textarea name="description" value={editedItemData?.description || ''} onChange={(e) => handleEditItemChange('description', e.target.value)} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none" />
                          <div className="space-y-2">
                            <input type="url" name="store_link" value={editedItemData?.store_link || ''} onChange={(e) => handleEditItemChange('store_link', e.target.value)} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" placeholder="Store Link (paste Amazon, Best Buy, etc.)" />
                            
                            {/* URL Preview for edit form */}
                            {(editItemPreview.loading || editItemPreview.data || editItemPreview.error) && (
                              <div className="space-y-2">
                                <UrlPreview 
                                  data={editItemPreview.data}
                                  loading={editItemPreview.loading}
                                  error={editItemPreview.error}
                                  onRetry={() => editItemPreview.previewUrl(editedItemData?.store_link || '')}
                                />
                                {editItemPreview.data && (
                                  <div className="flex space-x-2">
                                    <button 
                                      type="button"
                                      onClick={() => handleApplyEditPreviewData(editItemPreview.data)}
                                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      Use This Info
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={editItemPreview.clearPreview}
                                      className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                    >
                                      Dismiss
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <input type="text" name="cost" value={editedItemData?.cost || ''} onChange={(e) => handleEditItemChange('cost', e.target.value)} className="w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none" placeholder="Cost (e.g., $12.99)" />
                          <div className="flex space-x-2">
                            <button type="submit" className="flex-grow bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 dark:hover:bg-green-900">Save</button>
                            <button type="button" onClick={handleCancelEdit} className="flex-grow bg-gray-300 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-400">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {viewMode === 'grid' ? (
                            // Compact grid view - all elements inline (image and actions only, no drag handle)
                            <div className="flex items-start space-x-3">
                              {/* Image and price in center */}
                              <div className="flex-grow">
                                <div className="aspect-square mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden w-full max-w-[160px] mx-auto">
                                  {item.image_url ? (
                                    <img 
                                      src={item.image_url} 
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Price centered below image */}
                                <div className="text-center">
                                  <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                                    {item.cost || 'No price'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Action buttons on right */}
                              <div className="flex flex-col space-y-1">
                                {item.store_link && (
                                  <Tooltip text="View this item">
                                    <a
                                      href={item.store_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer"
                                    >
                                      <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                    </a>
                                  </Tooltip>
                                )}
                                <Tooltip text="Edit this item">
                                  <button onClick={() => handleEditItem(item)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer">
                                    <Pencil className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                  </button>
                                </Tooltip>
                                <Tooltip text="Duplicate this item">
                                  <button onClick={() => handleDuplicateItem(item)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer">
                                    <Copy className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                  </button>
                                </Tooltip>
                                <Tooltip text="Delete this item">
                                  <button onClick={() => handleDeleteItem(item.$id)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer">
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          ) : (
                            // List view - item details inline with actions (no drag handle)
                            <div className="flex items-center">
                              <div className="flex-grow px-3">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-200 text-lg">{item.name}</h4>
                                {item.description && (
                                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{item.description}</p>
                                )}
                                {item.cost && (
                                  <span className="text-green-600 dark:text-green-400 font-medium text-lg">{item.cost}</span>
                                )}
                              </div>
                              <div className="flex flex-col items-end space-y-2 ml-4">
                                {item.store_link && (
                                  <Tooltip text="View this item">
                                    <a
                                      href={item.store_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer"
                                    >
                                      <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                    </a>
                                  </Tooltip>
                                )}
                                <Tooltip text="Edit this item">
                                  <button onClick={() => handleEditItem(item)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer">
                                    <Pencil className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                  </button>
                                </Tooltip>
                                <Tooltip text="Duplicate this item">
                                  <button onClick={() => handleDuplicateItem(item)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer">
                                    <Copy className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                  </button>
                                </Tooltip>
                                <Tooltip text="Delete this item">
                                  <button onClick={() => handleDeleteItem(item.$id)} className="p-2 rounded-full bg-transparent hover:bg-gray-200 dark:hover:bg-neutral-700 focus:outline-none transition-colors flex items-center cursor-pointer">
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
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
              
              {/* Shipping Address Section */}
              {/* Shipping Address Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Shipping Info</h4>
                <div className="space-y-3">
                  <GoogleAddressAutocomplete
                    placeholder="Type school name or address..."
                    preferSchools={true}
                    onAddressSelect={(address: {
                      name: string;
                      address: string;
                      city?: string;
                      state?: string;
                      zip?: string;
                    }) => {
                      setFormData({
                        ...formData,
                        shipping_name: address.name || address.address || '',
                        shipping_address: address.address || '',
                        shipping_city: address.city || '',
                        shipping_state: address.state || '',
                        shipping_zip: address.zip || ''
                      });
                      // Immediately save shipping_info to wishlist as plain info, no prefixes
                      const cityState = address.city && address.state ? `${address.city}, ${address.state}` : `${address.city || ''}${address.state ? address.state : ''}`;
                      const shippingInfo = `${address.name || ''}\n${address.address || ''}\n${cityState}\n${address.zip || ''}`;
                      if (wishlist) {
                        databases.updateDocument(databaseId, wishlistsCollectionId, wishlist.$id, {
                          shipping_info: shippingInfo
                        });
                        setWishlist(prev => prev ? { ...prev, shipping_info: shippingInfo } : null);
                      }
                    }}
                    className="mt-1"
                  />
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">Selected School/Address</label>
                  <input
                    type="text"
                    value={formData.shipping_name}
                    onChange={e => setFormData({ ...formData, shipping_name: e.target.value })}
                    placeholder="School or address name"
                    className="mt-1 w-full p-2 rounded bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-gray-200 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className={`mt-1 w-full py-2 px-4 rounded-lg flex items-center justify-center transition-colors
                    ${settingsSaved ? 'bg-green-600 text-white' : 'bg-sky-600 text-white hover:bg-sky-800 dark:hover:bg-sky-800'}`}
                  disabled={settingsSaved}
                  onClick={() => setSettingsSaved(false)}
                >
                  {settingsSaved ? (
                    <span className="flex items-center">
                      <Check className="w-5 h-5 mr-2" />
                      Added to Supporter View
                    </span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      <Tooltip text="Save changes to your wishlist settings">
                        <span>Save Settings</span>
                      </Tooltip>
                    </>
                  )}
                </button>
              </div>
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