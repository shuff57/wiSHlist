/**
 * Appwrite Product Image Service
 * Uses self-hosted Appwrite Cloud Function for product image scraping
 */

import { Functions } from 'appwrite';
import { client } from '../appwriteConfig';

interface ProductImageOptions {
  width?: number;
  height?: number;
}

interface AppwriteImageResponse {
  images: string[];
  cached: boolean;
  retailer: string;
  count: number;
  error?: string;
}

class AppwriteImageService {
  private functions: Functions;

  constructor() {
    this.functions = new Functions(client);
  }

  /**
   * Get product images using Appwrite Cloud Function
   */
  async getProductImages(productUrl: string, productName: string = '', options: ProductImageOptions = {}): Promise<string[]> {
    console.log('🔍 AppwriteImageService: Getting images for:', productUrl);
    
    try {
      const response = await this.functions.createExecution(
        'product-scraper', // Function ID
        JSON.stringify({
          productUrl,
          productName,
          options
        })
      );

      if (response.status === 'completed') {
        const result: AppwriteImageResponse = JSON.parse(response.responseBody);
        
        if (result.error) {
          console.warn('⚠️ Function returned error:', result.error);
          return result.images || []; // May still have fallback images
        }

        console.log(`📸 Function returned ${result.count} images from ${result.retailer}${result.cached ? ' (cached)' : ''}`);
        return result.images;
      } else {
        throw new Error(`Function execution failed: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ AppwriteImageService error:', error);
      
      // Return placeholder on error
      const encodedName = encodeURIComponent(productName || 'Product');
      return [`https://placehold.co/150x150/e5e7eb/374151?text=${encodedName}&font=lato`];
    }
  }

  /**
   * Check if the service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Try a simple execution to check availability
      const response = await this.functions.createExecution(
        'product-scraper',
        JSON.stringify({ test: true })
      );
      return response !== null;
    } catch (error) {
      console.warn('AppwriteImageService not available:', error);
      return false;
    }
  }
}

// Export singleton instance
export const appwriteImageService = new AppwriteImageService();
