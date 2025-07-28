import React, { useState } from 'react';
import { extractThumbnailFromUrl, isImageUrl } from '../../utils/imageUtils';

interface ProductThumbnailProps {
  storeLink: string;
  itemName: string;
  className?: string;
}

export const ProductThumbnail: React.FC<ProductThumbnailProps> = ({ 
  storeLink, 
  itemName, 
  className = "w-16 h-16" 
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!storeLink || imageError) {
    return null;
  }

  // Check if the URL itself is an image
  const directImageUrl = isImageUrl(storeLink) ? storeLink : null;
  
  // Try to extract thumbnail from shopping site URLs
  const thumbnailUrl = directImageUrl || extractThumbnailFromUrl(storeLink);

  if (!thumbnailUrl) {
    return null;
  }

  return (
    <div className={`${className} bg-gray-100 dark:bg-neutral-700 rounded-lg overflow-hidden flex-shrink-0 relative`}>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={thumbnailUrl}
        alt={`${itemName} thumbnail`}
        className={`w-full h-full object-cover transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
};
