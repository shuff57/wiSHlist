import { MultiRetailerScraper } from './multiRetailerScraper';

export const extractThumbnailFromUrl = async (url: string): Promise<string | null> => {
  if (!url) return null;

  console.log('Extracting thumbnail from URL:', url);

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    console.log('Hostname:', hostname);

    // Use the multi-retailer scraper for supported sites
    if (hostname.includes('amazon.') || 
        hostname.includes('target.com') || 
        hostname.includes('walmart.com') || 
        hostname.includes('bestbuy.com')) {
      
      console.log('🛍️ Using multi-retailer scraper for:', hostname);
      try {
        const imageUrl = await MultiRetailerScraper.getProductImage(url);
        if (imageUrl) {
          console.log('✅ Found image via scraper:', imageUrl);
          return imageUrl;
        }
      } catch (error) {
        console.warn('❌ Scraper failed, falling back to legacy method:', error);
      }
    }

    // Legacy Amazon fallback
    if (hostname.includes('amazon.')) {
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})|\/([A-Z0-9]{10})(?:\/|\?|$)/i);
      if (asinMatch) {
        const asin = asinMatch[1] || asinMatch[2] || asinMatch[3] || asinMatch[4];
        console.log('Found Amazon ASIN:', asin);
        
        // Try multiple Amazon image URL formats (some may work better than others)
        const imageUrls = [
          `https://images.amazon.com/images/P/${asin}.01.L.jpg`,
          `https://m.media-amazon.com/images/I/${asin}._AC_SX300_SY300_.jpg`,
          `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SX300_.jpg`
        ];
        
        // For now, return the first one - we can add fallback logic later
        console.log('Using Amazon image URL:', imageUrls[0]);
        return imageUrls[0];
      }
    }

    // For unsupported sites, return null
    console.log('No supported retailer found for:', hostname);
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
