// Free Amazon Product API integration
// Based on tuhinpal/amazon-api (Cloudflare Workers API)

interface AmazonProductImage {
  url: string;
  width: number;
  height: number;
}

interface AmazonProductData {
  title: string;
  price?: string;
  currency?: string;
  images: AmazonProductImage[];
  rating?: number;
  reviews?: number;
  availability?: string;
  description?: string;
  features?: string[];
}

interface AmazonAPIResponse {
  success: boolean;
  data?: AmazonProductData;
  error?: string;
}

export class AmazonAPI {
  // Free API endpoints (rotate between multiple for reliability)
  private static readonly API_ENDPOINTS = [
    'https://amazon-api.tuhinpal.workers.dev',
    'https://amazon-scraper-api.vercel.app', // Alternative endpoint
  ];

  /**
   * Get product data from Amazon using ASIN
   */
  static async getProductByASIN(asin: string, country: string = 'US'): Promise<AmazonAPIResponse> {
    console.log('🔍 AmazonAPI: Fetching product data for ASIN:', asin);
    
    for (const endpoint of this.API_ENDPOINTS) {
      try {
        const url = `${endpoint}/product/${asin}?country=${country}`;
        console.log('🌐 Trying API endpoint:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          console.warn(`❌ API endpoint failed: ${endpoint} (${response.status})`);
          continue;
        }

        const data = await response.json();
        console.log('✅ AmazonAPI: Success!', data);
        
        if (data.success && data.data) {
          return {
            success: true,
            data: data.data
          };
        }
      } catch (error) {
        console.warn(`❌ Error with endpoint ${endpoint}:`, error);
        continue;
      }
    }

    return {
      success: false,
      error: 'All API endpoints failed'
    };
  }

  /**
   * Extract ASIN from Amazon URL
   */
  static extractASIN(amazonUrl: string): string | null {
    const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})|\/([A-Z0-9]{10})(?:\/|\?|$)/i);
    return asinMatch ? (asinMatch[1] || asinMatch[2] || asinMatch[3] || asinMatch[4]) : null;
  }

  /**
   * Get the best image URL from Amazon product data
   */
  static getBestImageUrl(productData: AmazonProductData, preferredWidth: number = 300): string | null {
    if (!productData.images || productData.images.length === 0) {
      return null;
    }

    // Sort images by size (largest first)
    const sortedImages = [...productData.images].sort((a, b) => {
      const aSize = a.width * a.height;
      const bSize = b.width * b.height;
      return bSize - aSize;
    });

    // Find image closest to preferred width
    const preferredImage = sortedImages.find(img => img.width >= preferredWidth) || sortedImages[0];
    
    return preferredImage?.url || null;
  }

  /**
   * Get all available image URLs from Amazon product data
   */
  static getAllImageUrls(productData: AmazonProductData): string[] {
    if (!productData.images) return [];
    
    return productData.images
      .map(img => img.url)
      .filter(url => url && url.length > 0);
  }
}

// Export convenience function
export const getAmazonProductImage = async (amazonUrl: string): Promise<string | null> => {
  const asin = AmazonAPI.extractASIN(amazonUrl);
  if (!asin) return null;

  const result = await AmazonAPI.getProductByASIN(asin);
  if (!result.success || !result.data) return null;

  return AmazonAPI.getBestImageUrl(result.data);
};
