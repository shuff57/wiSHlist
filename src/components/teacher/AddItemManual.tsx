import React, { useState, useEffect } from 'react';
import { databases, databaseId, itemsCollectionId } from '../../appwriteConfig';
import { Models, ID, Query } from 'appwrite';
import { Search, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

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

interface AddItemManualProps {
  wishlist: Models.Document & WishlistDoc;
  onItemAdded: (item: any) => void;
  suggestionMode?: boolean;
}

interface CachedItem {
  title: string;
  description: string;
  image: string | null;
  url: string;
  price: string | null;
}

export const AddItemManual: React.FC<AddItemManualProps> = ({ wishlist, onItemAdded, suggestionMode = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    store_link: '',
    cost: '',
    image_url: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestedItems, setSuggestedItems] = useState<CachedItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cache database configuration
  const CACHE_DATABASE_ID = '688189ad000ad6dd9410';
  const URL_CACHE_COLLECTION_ID = '68915fa8003d3174638e';

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Search cache for similar items using direct database access
  const searchCacheForSimilarItems = async (searchTerm: string) => {
    if (!searchTerm.trim() || searchTerm.length < 3) {
      setSuggestedItems([]);
      return;
    }

    setIsSearching(true);
    try {
      // Search for items in cache that match the search term
      const response = await databases.listDocuments(CACHE_DATABASE_ID, URL_CACHE_COLLECTION_ID, [
        Query.limit(5), // Limit to top 5 suggestions
        Query.orderDesc('timestamp') // Get most recent first
      ]);

      const suggestions: CachedItem[] = [];
      
      for (const doc of response.documents) {
        try {
          const metadata = JSON.parse(doc.metadata);
          
          // Use AI-enhanced data if available, otherwise fall back to original
          const title = doc.name || metadata.title || '';
          const description = doc.description || metadata.description || '';
          
          // Simple text matching - check if search term appears in title or description
          const searchLower = searchTerm.toLowerCase();
          if (title.toLowerCase().includes(searchLower) || 
              description.toLowerCase().includes(searchLower)) {
            
            suggestions.push({
              title: title || 'No title',
              description: description || '',
              image: metadata.image || null,
              url: doc.url,
              price: metadata.price || null
            });
          }
        } catch (error) {
          // Skip items with invalid metadata
          continue;
        }
      }

      setSuggestedItems(suggestions);
    } catch (error) {
      console.error('Error searching cache:', error);
      setSuggestedItems([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-search cache when item name changes
    if (name === 'name' && value.trim()) {
      // Clear existing timeout
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      // Set new timeout to search after user stops typing
      const searchTimer = setTimeout(() => {
        searchCacheForSimilarItems(value.trim());
      }, 500); // Wait 500ms after user stops typing
      
      setSearchTimeout(searchTimer);
    } else if (name === 'name' && !value.trim()) {
      // Clear suggestions if name is empty
      setSuggestedItems([]);
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    }
  };

  const handleUseSuggestion = (suggestion: CachedItem) => {
    setFormData({
      name: suggestion.title,
      description: suggestion.description,
      store_link: suggestion.url,
      cost: suggestion.price || '',
      image_url: suggestion.image || ''
    });
    setSuggestedItems([]); // Clear suggestions after using one
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      if (suggestionMode) {
        const itemData = {
          name: formData.name,
          description: formData.description,
          cost: formData.cost,
          store_link: formData.store_link,
          image_url: formData.image_url,
        };
        await onItemAdded(itemData);
      } else {
        const newItemDoc = await databases.createDocument(
          databaseId,
          itemsCollectionId,
          ID.unique(),
          {
            wishlist_id: wishlist.$id,
            ...formData,
            contributions: 0
          }
        );
        onItemAdded(newItemDoc as unknown as Models.Document & ItemDoc);
      }
      setFormData({ name: '', description: '', store_link: '', cost: '', image_url: '' });
    } catch (error) {
      alert('Failed to submit suggestion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Add New Item (Manual)
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Enter item details manually. Start typing an item name to see suggestions from cached items with AI-enhanced names and descriptions.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            name="name"
            placeholder="Item Name *"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 pr-12 rounded-lg bg-neutral-100 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {isSearching && (
              <Search size={16} className="text-gray-400 animate-pulse" />
            )}
          </div>
          
          {/* Suggestions Dropdown */}
          {suggestedItems.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              <div className="p-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-neutral-700">
                Similar items from cache:
              </div>
              {suggestedItems.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleUseSuggestion(suggestion)}
                  className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-neutral-700 border-b border-gray-100 dark:border-neutral-700 last:border-b-0 transition-colors"
                >
                  <div className="flex space-x-3">
                    {suggestion.image ? (
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={suggestion.image}
                          alt={suggestion.title}
                          fill
                          className="object-cover rounded border"
                          sizes="48px"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 dark:bg-neutral-600 rounded border flex-shrink-0 flex items-center justify-center">
                        <ImageIcon size={16} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {suggestion.title}
                      </h4>
                      {suggestion.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                          {suggestion.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        {suggestion.price && (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            {suggestion.price}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">Click to use</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Selected Item Preview */}
        {(formData.image_url || formData.name) && (
          <div className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
              Item Preview
            </h4>
            <div className="flex space-x-3">
              {formData.image_url ? (
                <div className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={formData.image_url}
                    alt={formData.name}
                    fill
                    className="object-cover rounded-lg border"
                    sizes="64px"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gray-200 dark:bg-neutral-600 rounded-lg border flex-shrink-0 flex items-center justify-center">
                  <ImageIcon size={20} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h5 className="font-medium text-gray-900 dark:text-gray-100 break-words">
                  {formData.name || 'Item Name'}
                </h5>
                {formData.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                    {formData.description}
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  {formData.cost && (
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formData.cost}
                    </span>
                  )}
                  {formData.image_url && (
                    <span className="text-xs text-blue-600 dark:text-blue-400">
                      Image from cache
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description (optional)
            </label>
            {formData.description && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formData.description.length}/150 chars
              </span>
            )}
          </div>
          <textarea
            name="description"
            placeholder="Description (optional) - suggestions may include AI-enhanced descriptions"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            maxLength={150}
            className="w-full p-3 rounded-lg bg-neutral-100 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        
        <div>
          <input
            type="url"
            name="store_link"
            placeholder="Store Link (optional)"
            value={formData.store_link}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-neutral-100 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <input
            type="text"
            name="cost"
            placeholder="Cost (e.g., $12.99)"
            value={formData.cost}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-neutral-100 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !formData.name.trim()}
          className={`w-full ${suggestionMode ? 'bg-purple-700 hover:bg-purple-900' : 'bg-green-600 hover:bg-green-700'} text-white py-3 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 font-medium`}
        >
          {isSubmitting ? 'Submitting...' : (suggestionMode ? 'Submit Suggestion' : 'Add to wiSHlist')}
        </button>
      </form>
    </div>
  );
};
