/**
 * Service for communicating with self-hosted scraping microservice
 */

const SCRAPING_SERVICE_URL = process.env.REACT_APP_SCRAPING_SERVICE_URL || 'http://localhost:3001';

interface ScrapingOptions {
  width?: number;
  height?: number;
}

interface ScrapingResponse {
  images: string[];
  retailer: string;
  count: number;
  cached: boolean;
  error?: string;
}

/**
 * Get product images from self-hosted scraping service
 */
export const getProductImages = async (
  productUrl: string, 
  productName?: string,
  options: ScrapingOptions = {}
): Promise<string[]> => {
  console.log(`🔍 Requesting images for: ${productUrl}`);
  
  try {
    const response = await fetch(`${SCRAPING_SERVICE_URL}/api/scrape-images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productUrl,
        productName,
        options: {
          width: 150,
          height: 150,
          ...options
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Scraping service error: ${response.status}`);
    }

    const data: ScrapingResponse = await response.json();
    
    console.log(`📸 Received ${data.count} images from ${data.retailer} (cached: ${data.cached})`);
    
    if (data.error) {
      console.warn(`⚠️ Scraping warning: ${data.error}`);
    }
    
    return data.images || [];
    
  } catch (error) {
    console.error('❌ Scraping service error:', error);
    
    // Return placeholder image as fallback
    const encodedName = encodeURIComponent(productName || 'Product');
    return [`https://placehold.co/150x150/e5e7eb/374151?text=${encodedName}&font=lato`];
  }
};

/**
 * Check if scraping service is healthy
 */
export const checkServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${SCRAPING_SERVICE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
};

export default {
  getProductImages,
  checkServiceHealth
};
