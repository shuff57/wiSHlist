import React from 'react';

interface ProductThumbnailProps {
  storeLink: string;
  itemName: string;
  className?: string;
}

export const ProductThumbnail: React.FC<ProductThumbnailProps> = () => {
  // Thumbnail functionality disabled - returning null (no rendering)
  return null;
};
