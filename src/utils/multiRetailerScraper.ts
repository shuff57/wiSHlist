// Multi-retailer product image scraper
// Based on popular GitHub scrapers with enhanced error handling and fallbacks

interface ProductData {
  title?: string;
  price?: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  rating?: string;
  availability?: string;
}

interface ScrapingResult {
  success: boolean;
  data?: ProductData;
  error?: string;
  source: string;
}

export class MultiRetailerScraper {
  private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  private static readonly REQUEST_HEADERS = {
    'User-Agent': this.USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'max-age=0',
  };

  /**
   * Scrape Amazon product using the proven ranjan-mohanty approach
   */
  static async scrapeAmazon(url: string): Promise<ScrapingResult> {
    console.log('🏪 Scraping Amazon:', url);
    
    if (!this.isValidAmazonUrl(url)) {
      return { success: false, error: 'Invalid Amazon URL', source: 'amazon' };
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.REQUEST_HEADERS,
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}`, source: 'amazon' };
      }

      const html = await response.text();
      
      // Check for blocking
      if (html.includes('To discuss automated access to Amazon data please contact')) {
        return { success: false, error: 'Blocked by Amazon', source: 'amazon' };
      }

      const data = this.parseAmazonHTML(html);
      return { success: true, data, source: 'amazon' };
    } catch (error) {
      return { success: false, error: `Network error: ${error}`, source: 'amazon' };
    }
  }

  /**
   * Scrape Target product 
   */
  static async scrapeTarget(url: string): Promise<ScrapingResult> {
    console.log('🎯 Scraping Target:', url);
    
    if (!url.includes('target.com')) {
      return { success: false, error: 'Not a Target URL', source: 'target' };
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.REQUEST_HEADERS,
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}`, source: 'target' };
      }

      const html = await response.text();
      const data = this.parseTargetHTML(html);
      return { success: true, data, source: 'target' };
    } catch (error) {
      return { success: false, error: `Network error: ${error}`, source: 'target' };
    }
  }

  /**
   * Scrape Walmart product
   */
  static async scrapeWalmart(url: string): Promise<ScrapingResult> {
    console.log('🛒 Scraping Walmart:', url);
    
    if (!url.includes('walmart.com')) {
      return { success: false, error: 'Not a Walmart URL', source: 'walmart' };
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.REQUEST_HEADERS,
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}`, source: 'walmart' };
      }

      const html = await response.text();
      const data = this.parseWalmartHTML(html);
      return { success: true, data, source: 'walmart' };
    } catch (error) {
      return { success: false, error: `Network error: ${error}`, source: 'walmart' };
    }
  }

  /**
   * Scrape Best Buy product
   */
  static async scrapeBestBuy(url: string): Promise<ScrapingResult> {
    console.log('🔵 Scraping Best Buy:', url);
    
    if (!url.includes('bestbuy.com')) {
      return { success: false, error: 'Not a Best Buy URL', source: 'bestbuy' };
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.REQUEST_HEADERS,
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}`, source: 'bestbuy' };
      }

      const html = await response.text();
      const data = this.parseBestBuyHTML(html);
      return { success: true, data, source: 'bestbuy' };
    } catch (error) {
      return { success: false, error: `Network error: ${error}`, source: 'bestbuy' };
    }
  }

  /**
   * Universal scraper that detects retailer and uses appropriate method
   */
  static async scrapeProduct(url: string): Promise<ScrapingResult> {
    console.log('🔍 Auto-detecting retailer for:', url);
    
    // Detect retailer and use appropriate scraper
    if (url.includes('amazon.')) {
      return this.scrapeAmazon(url);
    } else if (url.includes('target.com')) {
      return this.scrapeTarget(url);
    } else if (url.includes('walmart.com')) {
      return this.scrapeWalmart(url);
    } else if (url.includes('bestbuy.com')) {
      return this.scrapeBestBuy(url);
    } else {
      return { success: false, error: 'Unsupported retailer', source: 'unknown' };
    }
  }

  /**
   * Parse Amazon HTML using proven selectors
   */
  private static parseAmazonHTML(html: string): ProductData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Title
    const titleElement = doc.querySelector('#productTitle, .product-title');
    const title = titleElement?.textContent?.trim();

    // Price
    const priceSelectors = [
      '.a-price .a-offscreen',
      '.a-price-whole',
      '#price_display',
      '.a-price-range .a-price .a-offscreen',
      '#apex_desktop .a-price .a-offscreen'
    ];
    let price = null;
    for (const selector of priceSelectors) {
      const priceElement = doc.querySelector(selector);
      if (priceElement?.textContent?.trim()) {
        price = priceElement.textContent.trim();
        break;
      }
    }

    // Description
    const descriptionElement = doc.querySelector('#feature-bullets ul, #feature-bullets, .a-unordered-list.a-vertical');
    const description = descriptionElement?.textContent?.trim();

    // Images
    const imageUrls: string[] = [];
    
    // Try to find images using various selectors
    const imageSelectors = [
      '#landingImage',
      '[data-a-image-name="landingImage"]',
      '.a-dynamic-image',
      '#imgBlkFront',
      '.a-image-wrapper img',
    ];

    for (const selector of imageSelectors) {
      const img = doc.querySelector(selector) as HTMLImageElement;
      if (img?.src && !imageUrls.includes(img.src)) {
        imageUrls.push(img.src);
      }
    }

    // Also try to extract from JSON-LD scripts
    try {
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => {
        const data = JSON.parse(script.textContent || '{}');
        if (data.image) {
          const images = Array.isArray(data.image) ? data.image : [data.image];
          images.forEach((img: string) => {
            if (img && !imageUrls.includes(img)) {
              imageUrls.push(img);
            }
          });
        }
      });
    } catch (e) {
      // Ignore JSON parsing errors
    }

    // Rating
    const ratingElement = doc.querySelector('.a-icon-alt, [data-hook="rating-out-of-text"]');
    const rating = ratingElement?.textContent?.trim();

    return {
      title,
      price: price || undefined,
      description,
      imageUrl: imageUrls[0],
      images: imageUrls,
      rating
    };
  }

  /**
   * Parse Target HTML
   */
  private static parseTargetHTML(html: string): ProductData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Title
    const titleElement = doc.querySelector('[data-test="product-title"], h1');
    const title = titleElement?.textContent?.trim();

    // Price
    const priceElement = doc.querySelector('[data-test="product-price"], .Price-characteristic');
    const price = priceElement?.textContent?.trim();

    // Images
    const imageUrls: string[] = [];
    const imageElements = doc.querySelectorAll('[data-test="hero-image-wrapper"] img, .ProductImages img');
    imageElements.forEach(img => {
      const src = (img as HTMLImageElement).src;
      if (src && !imageUrls.includes(src)) {
        imageUrls.push(src);
      }
    });

    // Also check for JSON-LD
    try {
      const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
      scripts.forEach(script => {
        const data = JSON.parse(script.textContent || '{}');
        if (data.image) {
          const images = Array.isArray(data.image) ? data.image : [data.image];
          images.forEach((img: string) => {
            if (img && !imageUrls.includes(img)) {
              imageUrls.push(img);
            }
          });
        }
      });
    } catch (e) {
      // Ignore JSON parsing errors
    }

    return {
      title,
      price,
      imageUrl: imageUrls[0],
      images: imageUrls
    };
  }

  /**
   * Parse Walmart HTML
   */
  private static parseWalmartHTML(html: string): ProductData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Title
    const titleElement = doc.querySelector('[data-automation-id="product-title"], h1');
    const title = titleElement?.textContent?.trim();

    // Price
    const priceElement = doc.querySelector('[itemprop="price"], [data-automation-id="product-price"]');
    const price = priceElement?.textContent?.trim();

    // Images
    const imageUrls: string[] = [];
    const imageElements = doc.querySelectorAll('.prod-ProductImage img, [data-testid="hero-image"] img');
    imageElements.forEach(img => {
      const src = (img as HTMLImageElement).src;
      if (src && !imageUrls.includes(src)) {
        imageUrls.push(src);
      }
    });

    return {
      title,
      price,
      imageUrl: imageUrls[0],
      images: imageUrls
    };
  }

  /**
   * Parse Best Buy HTML
   */
  private static parseBestBuyHTML(html: string): ProductData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Title
    const titleElement = doc.querySelector('.sku-title h1, [data-testid="product-title"]');
    const title = titleElement?.textContent?.trim();

    // Price
    const priceElement = doc.querySelector('.pricing-price__range, .sr-only:contains("current price")');
    const price = priceElement?.textContent?.trim();

    // Images
    const imageUrls: string[] = [];
    const imageElements = doc.querySelectorAll('.primary-image img, .image-carousel img');
    imageElements.forEach(img => {
      const src = (img as HTMLImageElement).src;
      if (src && !imageUrls.includes(src)) {
        imageUrls.push(src);
      }
    });

    return {
      title,
      price,
      imageUrl: imageUrls[0],
      images: imageUrls
    };
  }

  /**
   * Validate Amazon URL
   */
  private static isValidAmazonUrl(url: string): boolean {
    const validDomains = [
      'amazon.com', 'amazon.ca', 'amazon.co.uk', 'amazon.de',
      'amazon.fr', 'amazon.in', 'amazon.it', 'amazon.co.jp',
      'amazon.cn', 'amazon.com.mx', 'amazon.com.au', 'amazon.nl',
      'amazon.pl', 'amazon.sg', 'amazon.sa', 'amazon.es',
      'amazon.se', 'amazon.ae', 'amazon.br', 'amazon.com.tr',
      'amzn.to'
    ];
    
    return validDomains.some(domain => url.includes(domain));
  }

  /**
   * Get just the image URL from any supported retailer
   */
  static async getProductImage(url: string): Promise<string | null> {
    const result = await this.scrapeProduct(url);
    return result.success ? result.data?.imageUrl || null : null;
  }
}

// Export convenience function
export const scrapeProductImage = async (url: string): Promise<string | null> => {
  return MultiRetailerScraper.getProductImage(url);
};
