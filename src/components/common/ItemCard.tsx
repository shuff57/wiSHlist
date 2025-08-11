import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { UrlPreview } from '../common/UrlPreview';
import { useUrlPreview } from '../../hooks/useUrlPreview';
import { Image as ImageIcon } from 'lucide-react';

interface ItemCardProps {
  item: {
    $id: string;
    name: string;
    description?: string;
    store_link?: string;
    cost?: string;
    image_url?: string;
  };
  viewMode?: 'list' | 'grid';
  showUrlPreview?: boolean;
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  viewMode = 'list',
  showUrlPreview = true, 
  className = '',
  onEdit,
  onDelete,
  onDuplicate
}) => {
  const itemPreview = useUrlPreview();
  const [cachedImage, setCachedImage] = useState<string | null>(null);
  
  useEffect(() => {
    // Only use cached image - no URL preview for existing items
    if (item.image_url) {
      setCachedImage(item.image_url);
    }
    
    // Don't auto-preview URLs for existing items - they already have their data
    // URL preview should only be used when adding new items
    
    return () => {
      itemPreview.clearPreview();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.image_url]); // Intentionally removed itemPreview dependency as we only want to clear on unmount

  // For existing items, only use cached image (no URL preview needed)
  const displayImage = cachedImage || null;

  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow hover:shadow-md transition-shadow ${className}`}>
      <div className="p-4">
        <div className="flex space-x-3">
          {/* Item Image */}
          {displayImage && (
            <div className="flex-shrink-0">
              <Image
                src={displayImage}
                alt={item.name}
                width={64}
                height={64}
                className="w-16 h-16 object-cover rounded-lg border"
                onError={() => setCachedImage(null)}
              />
            </div>
          )}
          
          {/* No image placeholder */}
          {!displayImage && (
            <div className="w-16 h-16 bg-gray-100 dark:bg-neutral-700 rounded-lg border flex items-center justify-center flex-shrink-0">
              <ImageIcon size={20} className="text-gray-400" />
            </div>
          )}
          
          {/* Item Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-gray-200 text-lg truncate">
              {item.name}
            </h4>
            {item.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                {item.description}
              </p>
            )}
            <div className="flex items-center space-x-3 mt-2">
              {item.cost && (
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {item.cost}
                </span>
              )}
              {item.store_link && (
                <a
                  href={item.store_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                >
                  View Store
                </a>
              )}
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        {(onEdit || onDelete || onDuplicate) && (
          <div className={`flex ${viewMode === 'grid' ? 'justify-end mt-4' : 'justify-start mt-2'} space-x-2`}>
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={onDuplicate}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Duplicate
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
