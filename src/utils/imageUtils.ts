export const extractThumbnailFromUrl = (url: string): string | null => {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Amazon product URLs
    if (hostname.includes('amazon.')) {
      // Extract ASIN from Amazon URLs
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})/i);
      if (asinMatch) {
        const asin = asinMatch[1] || asinMatch[2] || asinMatch[3];
        return `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.L.jpg`;
      }
    }

    // Target URLs
    if (hostname.includes('target.com')) {
      // Extract product ID from Target URLs
      const targetMatch = url.match(/\/A-(\d+)/);
      if (targetMatch) {
        const productId = targetMatch[1];
        return `https://target.scene7.com/is/image/Target/GUEST_${productId}?wid=200&hei=200&fmt=pjpeg`;
      }
    }

    // Walmart URLs
    if (hostname.includes('walmart.com')) {
      // Extract product ID from Walmart URLs
      const walmartMatch = url.match(/\/ip\/[^\/]+\/(\d+)/);
      if (walmartMatch) {
        const productId = walmartMatch[1];
        return `https://i5.walmartimages.com/asr/${productId}?odnHeight=200&odnWidth=200&odnBg=FFFFFF`;
      }
    }

    // Best Buy URLs
    if (hostname.includes('bestbuy.com')) {
      const bestbuyMatch = url.match(/\/(\d{7})/);
      if (bestbuyMatch) {
        const sku = bestbuyMatch[1];
        return `https://pisces.bbystatic.com/image2/BestBuy_US/images/products/${sku.substring(0, 4)}/${sku}_sd.jpg`;
      }
    }

    // eBay URLs
    if (hostname.includes('ebay.com')) {
      const ebayMatch = url.match(/\/itm\/([^\/\?]+)/);
      if (ebayMatch) {
        // eBay doesn't have a direct API for thumbnails without authentication
        // For now, return null - could be enhanced with eBay API integration
        return null;
      }
    }

    return null;
  } catch (error) {
    console.warn('Error extracting thumbnail from URL:', error);
    return null;
  }
};

export const isImageUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(pathname);
  } catch {
    return false;
  }
};
