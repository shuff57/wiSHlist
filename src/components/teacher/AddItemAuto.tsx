import React, { useState, useEffect } from 'react';
import { databases, databaseId, itemsCollectionId } from '../../appwriteConfig';
import { Models, ID } from 'appwrite';
import { UrlPreview } from '../common/UrlPreview';
import { useUrlPreview } from '../../hooks/useUrlPreview';
import { CheckCircle, XCircle, Edit3, Save, X } from 'lucide-react';

interface WishlistDoc {
  wishlist_name?: string;
  contact_info?: string;
  wishlist_key: string;
  shipping_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
}

interface ItemDoc {
  name: string;
  description?: string;
  store_link?: string;
  cost?: string;
  contributions: number;
  position: number;
}

interface AddItemAutoProps {
  wishlist: Models.Document & WishlistDoc;
  onItemAdded: (item: Models.Document & ItemDoc) => void;
  existingItems?: (Models.Document & ItemDoc)[]; // Optional - no breaking changes
}

export const AddItemAuto: React.FC<AddItemAutoProps> = ({ wishlist, onItemAdded, existingItems = [] }) => {
  const [url, setUrl] = useState('');
  const [urlPreviewTimeout, setUrlPreviewTimeout] = useState<NodeJS.Timeout | null>(null);
  const [editableData, setEditableData] = useState({
    name: '',
    description: '',
    cost: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  
  const urlPreview = useUrlPreview();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (urlPreviewTimeout) {
        clearTimeout(urlPreviewTimeout);
      }
    };
  }, [urlPreviewTimeout]);

  // Function to check if URL already exists in the wishlist (only if existingItems provided)
  const checkForDuplicateUrl = (inputUrl: string): string | null => {
    if (!existingItems || existingItems.length === 0) {
      return null; // No duplicate checking if existingItems not provided - no breaking changes
    }
    
    const normalizedInputUrl = inputUrl.toLowerCase().trim();
    
    for (const item of existingItems) {
      if (item.store_link) {
        const normalizedExistingUrl = item.store_link.toLowerCase().trim();
        
        // Check for exact match
        if (normalizedInputUrl === normalizedExistingUrl) {
          return `This URL already exists as "${item.name}"`;
        }
        
        // Check for Amazon product matches (same ASIN)
        const inputAsin = normalizedInputUrl.match(/\/dp\/([A-Z0-9]{10})/);
        const existingAsin = normalizedExistingUrl.match(/\/dp\/([A-Z0-9]{10})/);
        
        if (inputAsin && existingAsin && inputAsin[1] === existingAsin[1]) {
          return `This Amazon product already exists as "${item.name}"`;
        }
        
        // Check for similar URLs (same domain and path without query params)
        try {
          const inputUrlObj = new URL(normalizedInputUrl);
          const existingUrlObj = new URL(normalizedExistingUrl);
          
          if (inputUrlObj.hostname === existingUrlObj.hostname && 
              inputUrlObj.pathname === existingUrlObj.pathname) {
            return `A similar URL already exists as "${item.name}"`;
          }
        } catch {
          // Invalid URL, skip comparison
        }
      }
    }
    
    return null;
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    
    // Clear existing timeout and warnings
    if (urlPreviewTimeout) {
      clearTimeout(urlPreviewTimeout);
    }
    setDuplicateWarning(null);
    
    if (value.trim() && value.startsWith('http')) {
      // Check for duplicates if existingItems is provided
      const duplicateMessage = checkForDuplicateUrl(value.trim());
      
      if (duplicateMessage) {
        setDuplicateWarning(duplicateMessage);
        // Don't load preview for duplicates - saves API calls and time
        urlPreview.clearPreview();
        return;
      }
      
      // Set new timeout to preview URL after user stops typing (only if not duplicate)
      const timeout = setTimeout(() => {
        urlPreview.previewUrl(value.trim());
      }, 1000); // Wait 1 second after user stops typing
      
      setUrlPreviewTimeout(timeout);
    } else {
      // Clear preview if URL is removed or invalid
      urlPreview.clearPreview();
    }
  };

  // Auto-populate editable data when preview loads
  useEffect(() => {
    if (urlPreview.data && !isEditing) {
      // Use AI-enhanced data if available, otherwise fall back to original scraped data
      const name = urlPreview.data._ai?.enhanced ? urlPreview.data._ai.name : urlPreview.data.title;
      const description = urlPreview.data._ai?.enhanced ? urlPreview.data._ai.description : urlPreview.data.description;
      
      setEditableData({
        name: name || '',
        description: description || '',
        cost: urlPreview.data.price || ''
      });
    }
  }, [urlPreview.data, isEditing]);

  const handleEditableDataChange = (field: keyof typeof editableData, value: string) => {
    setEditableData(prev => ({ ...prev, [field]: value }));
  };

  const handleUseThisItem = async () => {
    if (!urlPreview.data || !editableData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const newItemDoc = await databases.createDocument(
        databaseId,
        itemsCollectionId,
        ID.unique(),
        {
          wishlist_id: wishlist.$id,
          name: editableData.name,
          description: editableData.description,
          store_link: url,
          cost: editableData.cost,
          image_url: urlPreview.data.image || null, // Save the scraped image URL
          contributions: 0
        }
      );
      
      onItemAdded(newItemDoc as unknown as Models.Document & ItemDoc);
      
      // Reset form
      setUrl('');
      setEditableData({ name: '', description: '', cost: '' });
      setIsEditing(false);
      urlPreview.clearPreview();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismiss = () => {
    urlPreview.clearPreview();
    setEditableData({ name: '', description: '', cost: '' });
    setIsEditing(false);
  };

  const handleClearUrl = () => {
    setUrl('');
    urlPreview.clearPreview();
    setEditableData({ name: '', description: '', cost: '' });
    setIsEditing(false);
    if (urlPreviewTimeout) {
      clearTimeout(urlPreviewTimeout);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Add New Item (Auto)
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Paste a URL to automatically extract item details, then customize and add to your list
      </p>
      
      <div className="space-y-4">
        {/* URL Input */}
        <div className="relative">
          <input
            type="url"
            placeholder="Paste Amazon, Best Buy, or other store URL..."
            value={url}
            onChange={handleUrlChange}
            className="w-full p-3 pr-10 rounded-lg bg-neutral-100 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {url && (
            <button
              onClick={handleClearUrl}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Duplicate Warning */}
        {duplicateWarning && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
            <div className="flex items-center space-x-2">
              <div className="text-amber-600 dark:text-amber-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                This item appears to already be in your wishlist. Consider checking your existing items before adding duplicates.
              </p>
            </div>
          </div>
        )}

        {/* URL Preview */}
        {(urlPreview.loading || urlPreview.data || urlPreview.error) && (
          <div className="space-y-4">
            <UrlPreview 
              data={urlPreview.data}
              loading={urlPreview.loading}
              error={urlPreview.error}
              onRetry={() => urlPreview.previewUrl(url)}
              className="border-l-4 border-blue-500 pl-3"
            />
            
            {/* Editable Item Data */}
            {urlPreview.data && (
              <div className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Item Details
                  </h4>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
                  </button>
                </div>
                
                <div className="space-y-3">
                  {/* Item Name */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Item Name *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editableData.name}
                        onChange={(e) => handleEditableDataChange('name', e.target.value)}
                        className="w-full p-2 text-sm rounded bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 dark:text-gray-200 p-2 bg-white dark:bg-neutral-800 rounded border">
                        {editableData.name || 'No title available'}
                      </p>
                    )}
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editableData.description}
                        onChange={(e) => handleEditableDataChange('description', e.target.value)}
                        rows={2}
                        className="w-full p-2 text-sm rounded bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400 p-2 bg-white dark:bg-neutral-800 rounded border min-h-[2.5rem]">
                        {editableData.description || 'No description available'}
                      </p>
                    )}
                  </div>
                  
                  {/* Cost */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Cost
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editableData.cost}
                        onChange={(e) => handleEditableDataChange('cost', e.target.value)}
                        placeholder="e.g., $12.99"
                        className="w-full p-2 text-sm rounded bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 dark:text-gray-200 p-2 bg-white dark:bg-neutral-800 rounded border">
                        {editableData.cost || 'No price available'}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={handleUseThisItem}
                    disabled={isSubmitting || !editableData.name.trim()}
                    className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
                  >
                    <CheckCircle size={16} />
                    <span>{isSubmitting ? 'Adding...' : 'Use This Item'}</span>
                  </button>
                  
                  <button
                    onClick={handleDismiss}
                    className="flex items-center justify-center space-x-2 bg-gray-300 dark:bg-neutral-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded-lg hover:bg-gray-400 dark:hover:bg-neutral-500 transition-colors duration-200"
                  >
                    <XCircle size={16} />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
