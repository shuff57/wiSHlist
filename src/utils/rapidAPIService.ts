// RapidAPI Amazon scraping services
// Multiple providers for better reliability

interface RapidAPIConfig {
  apiKey?: string;
  baseUrl: string;
  headers: Record<string, string>;
}

interface ProductImageResult {
  success: boolean;
  imageUrl?: string;
  title?: string;
  price?: string;
  error?: string;
}

export class RapidAPIAmazonService {
  // Free tier API services (require API key for production)
  private static readonly SERVICES: Record<string, RapidAPIConfig> = {
    // ScrapingAnt - Free tier available
    scrapingant: {
      baseUrl: 'https://scrapingant.p.rapidapi.com/v2/general',
      headers: {
        'X-RapidAPI-Host': 'scrapingant.p.rapidapi.com',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
      }
    },
    
    // Amazon Data Scraper - Free tier
    amazondata: {
      baseUrl: 'https://amazon-data-scraper.p.rapidapi.com',
      headers: {
        'X-RapidAPI-Host': 'amazon-data-scraper.p.rapidapi.com',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
      }
    },

    // Real-Time Amazon Data API
    realtime: {
      baseUrl: 'https://real-time-amazon-data.p.rapidapi.com',
      headers: {
        'X-RapidAPI-Host': 'real-time-amazon-data.p.rapidapi.com',
        'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
      }
    }
  };

  /**
   * Scrape Amazon product using ScrapingAnt
   */
  static async scrapeWithScrapingAnt(amazonUrl: string): Promise<ProductImageResult> {
    const config = this.SERVICES.scrapingant;
    
    if (!config.headers['X-RapidAPI-Key']) {
      return { success: false, error: 'RapidAPI key not configured' };
    }

    try {
      const url = `${config.baseUrl}?url=${encodeURIComponent(amazonUrl)}&browser=false`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: config.headers,
      });

      if (!response.ok) {
        return { success: false, error: `ScrapingAnt API error: ${response.status}` };
      }

      const data = await response.json();
      
      // Parse HTML to extract image
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.content, 'text/html');
      
      // Amazon product image selectors
      const imageSelectors = [
        '#landingImage',
        '[data-a-image-name="landingImage"]',
        '.a-dynamic-image',
        '#imgBlkFront',
        '.a-image-wrapper img',
      ];

      for (const selector of imageSelectors) {
        const img = doc.querySelector(selector) as HTMLImageElement;
        if (img && img.src) {
          const title = doc.querySelector('#productTitle')?.textContent?.trim();
          const price = doc.querySelector('.a-price-whole')?.textContent?.trim();
          
          return {
            success: true,
            imageUrl: img.src,
            title,
            price
          };
        }
      }

      return { success: false, error: 'No product image found' };
    } catch (error) {
      return { success: false, error: `ScrapingAnt error: ${error}` };
    }
  }

  /**
   * Get product data using Amazon Data Scraper API
   */
  static async getProductWithAmazonData(asin: string): Promise<ProductImageResult> {
    const config = this.SERVICES.amazondata;
    
    if (!config.headers['X-RapidAPI-Key']) {
      return { success: false, error: 'RapidAPI key not configured' };
    }

    try {
      const url = `${config.baseUrl}/product-details?asin=${asin}&country=US`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: config.headers,
      });

      if (!response.ok) {
        return { success: false, error: `Amazon Data API error: ${response.status}` };
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const productData = data.data;
        return {
          success: true,
          imageUrl: productData.main_image || productData.images?.[0],
          title: productData.title,
          price: productData.price
        };
      }

      return { success: false, error: 'Invalid API response' };
    } catch (error) {
      return { success: false, error: `Amazon Data API error: ${error}` };
    }
  }

  /**
   * Try all available RapidAPI services in sequence
   */
  static async getBestProductImage(amazonUrl: string): Promise<ProductImageResult> {
    console.log('🔍 RapidAPI: Trying to get product image for:', amazonUrl);
    
    // Extract ASIN for APIs that need it
    const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})/i);
    const asin = asinMatch ? (asinMatch[1] || asinMatch[2] || asinMatch[3]) : null;

    // Try ScrapingAnt first (works with full URLs)
    console.log('🌐 Trying ScrapingAnt...');
    const scrapingResult = await this.scrapeWithScrapingAnt(amazonUrl);
    if (scrapingResult.success) {
      console.log('✅ ScrapingAnt success!');
      return scrapingResult;
    }

    // Try Amazon Data API if we have ASIN
    if (asin) {
      console.log('🌐 Trying Amazon Data API...');
      const dataResult = await this.getProductWithAmazonData(asin);
      if (dataResult.success) {
        console.log('✅ Amazon Data API success!');
        return dataResult;
      }
    }

    console.log('❌ All RapidAPI services failed');
    return { 
      success: false, 
      error: 'All RapidAPI services failed. Configure RAPIDAPI_KEY environment variable.' 
    };
  }
}

// Export convenience function
export const getRapidAPIProductImage = async (amazonUrl: string): Promise<string | null> => {
  const result = await RapidAPIAmazonService.getBestProductImage(amazonUrl);
  return result.success ? result.imageUrl || null : null;
};
