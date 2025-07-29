// Production-ready service for fetching product images
// This can be extended to use backend services, APIs, or caching

import { MultiRetailerScraper } from './multiRetailerScraper';
import { AmazonAPI } from './amazonAPI';

interface ProductImageOptions {
  width?: number;
  height?: number;
  fallbackText?: string;
}

export class ProductImageService {
  
  /**
   * Get the best available image for a product URL
   * This is the main method you should use in production
   */
  static async getBestProductImage(
    productUrl: string, 
    productName: string, 
    options: ProductImageOptions = {}
  ): Promise<string[]> {
    console.log('🔍 ProductImageService.getBestProductImage called with:', { productUrl, productName, options });
    
    const { width = 150, height = 150, fallbackText } = options;
    const allUrls: string[] = [];

    // Strategy 1: Try the new multi-retailer scraper first
    try {
      console.log('🛍️ Trying multi-retailer scraper...');
      const scrapedImage = await MultiRetailerScraper.getProductImage(productUrl);
      if (scrapedImage) {
        console.log('✅ Multi-retailer scraper found image:', scrapedImage);
        allUrls.push(scrapedImage);
      }
    } catch (error) {
      console.warn('❌ Multi-retailer scraper failed:', error);
    }

    // Strategy 2: For Amazon URLs, try the free Amazon API
    if (productUrl.includes('amazon.')) {
      try {
        console.log('🏪 Trying Amazon API...');
        const asin = AmazonAPI.extractASIN(productUrl);
        if (asin) {
          const amazonImage = await AmazonAPI.getProductByASIN(asin);
          if (amazonImage.success && amazonImage.data) {
            const imageUrl = AmazonAPI.getBestImageUrl(amazonImage.data, width);
            if (imageUrl) {
              console.log('✅ Amazon API found image:', imageUrl);
              allUrls.push(imageUrl);
            }
          }
        }
      } catch (error) {
        console.warn('❌ Amazon API failed:', error);
      }

      // Strategy 3: Skip Direct Amazon URLs due to CORS issues
      console.log('⚡ Skipping direct Amazon URLs - causing 400 errors');

      // Strategy 4: Proxy service URLs (more reliable)
      const proxyUrls = this.getProxyImageUrls(productUrl, width, height);
      if (proxyUrls.length > 0) {
        console.log('🌐 Adding proxy URLs:', proxyUrls);
        allUrls.push(...proxyUrls);
      }
    }

    // Strategy 5: Fallback placeholder
    const placeholder = this.getPlaceholderImage(
      fallbackText || productName, 
      width, 
      height
    );
    console.log('🖼️ Adding placeholder:', placeholder);
    allUrls.push(placeholder);

    console.log('🎯 Generated', allUrls.length, 'thumbnail URLs for:', productName);
    return allUrls;
  }
  
  /**
   * Extract direct Amazon image URLs
   */
  private static getDirectAmazonImages(
    productUrl: string, 
    width: number, 
    height: number
  ): string[] {
    if (!productUrl.includes('amazon.')) {
      // console.log('❌ Not an Amazon URL:', productUrl);
      return [];
    }
    
    // console.log('🔍 Extracting ASIN from Amazon URL:', productUrl);
    const asinMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})|\/([A-Z0-9]{10})(?:\/|\?|$)/i);
    // console.log('🔍 ASIN match result:', asinMatch);
    
    if (!asinMatch) {
      console.log('❌ No ASIN found in Amazon URL');
      return [];
    }
    
    const asin = asinMatch[1] || asinMatch[2] || asinMatch[3] || asinMatch[4];
    console.log('✅ Extracted ASIN:', asin, 'from Amazon URL');
    
    const urls = [
      `https://m.media-amazon.com/images/I/${asin}._AC_UL${width}_.jpg`,
      `https://m.media-amazon.com/images/I/${asin}._AC_SX${width}_SY${height}_.jpg`,
      `https://images-na.ssl-images-amazon.com/images/I/${asin}._UL${width}_.jpg`,
    ];
    
    // console.log('📸 Generated direct Amazon URLs:', urls);
    return urls;
  }
  
  /**
   * Get image URLs using proxy services to bypass CORS
   */
  private static getProxyImageUrls(
    productUrl: string, 
    width: number, 
    height: number
  ): string[] {
    if (!productUrl.includes('amazon.')) {
      // console.log('❌ Not an Amazon URL for proxy:', productUrl);
      return [];
    }
    
    const asinMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})|\/([A-Z0-9]{10})(?:\/|\?|$)/i);
    if (!asinMatch) {
      // console.log('❌ No ASIN found for proxy URLs');
      return [];
    }
    
    const asin = asinMatch[1] || asinMatch[2] || asinMatch[3] || asinMatch[4];
    // console.log('✅ Using ASIN for proxy URLs:', asin);
    
    const amazonImageUrl = `https://images.amazon.com/images/P/${asin}.01.L.jpg`;
    const mobileImageUrl = `https://m.media-amazon.com/images/I/${asin}._AC_UL320_.jpg`;
    
    const proxyUrls = [
      // WeServ image proxy (free service)
      `https://images.weserv.nl/?url=${encodeURIComponent(amazonImageUrl)}&w=${width}&h=${height}&fit=cover&errorredirect=404`,
      `https://images.weserv.nl/?url=${encodeURIComponent(mobileImageUrl)}&w=${width}&h=${height}&fit=cover&errorredirect=404`,
      
      // Alternative proxy (backup)
      `https://wsrv.nl/?url=${encodeURIComponent(amazonImageUrl)}&w=${width}&h=${height}&fit=cover`,
    ];
    
    // console.log('🌐 Generated proxy URLs:', proxyUrls);
    return proxyUrls;
  }
  
  /**
   * Generate a placeholder image with product name
   */
  private static getPlaceholderImage(
    text: string, 
    width: number, 
    height: number
  ): string {
    const shortText = text.length > 15 ? text.substring(0, 15) + '...' : text;
    return `https://placehold.co/${width}x${height}/e5e7eb/374151?text=${encodeURIComponent(shortText)}&font=lato`;
  }
  
  /**
   * For production: Implement backend image caching
   * This would cache images on your server to avoid repeated requests
   */
  static async getCachedProductImage(
    productUrl: string, 
    productName: string
  ): Promise<string> {
    // This would call your backend API
    // Example: POST /api/cache-product-image
    // Your backend would:
    // 1. Check if image is already cached
    // 2. If not, scrape the product page for the actual image
    // 3. Download and store the image on your server/CDN
    // 4. Return the cached image URL
    
    try {
      const response = await fetch('/api/cache-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl, name: productName })
      });
      
      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.warn('Failed to get cached image:', error);
      return this.getPlaceholderImage(productName, 150, 150);
    }
  }
}

// Export convenience function for easy use
export const getProductImageUrls = (
  productUrl: string, 
  productName: string, 
  options?: ProductImageOptions
) => ProductImageService.getBestProductImage(productUrl, productName, options);
