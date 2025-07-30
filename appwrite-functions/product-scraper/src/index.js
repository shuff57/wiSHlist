import { Client, Databases } from 'node-appwrite';

/**
 * Appwrite Cloud Function for Product Image Scraping
 * This function scrapes product images from various retailers
 * and caches the results in Appwrite Database
 */

export default async ({ req, res, log, error }) => {
  const client = new Client();
  const databases = new Databases(client);

  // Initialize Appwrite client
  client
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_FUNCTION_API_KEY);

  try {
    const { productUrl, productName, options = {} } = JSON.parse(req.body);
    
    if (!productUrl) {
      return res.json({ error: 'Product URL is required' }, 400);
    }

    log(`🔍 Scraping product images for: ${productUrl}`);

    // Check cache first
    const cacheKey = Buffer.from(productUrl).toString('base64').slice(0, 30);
    let cachedResult = null;
    
    try {
      cachedResult = await databases.getDocument(
        process.env.APPWRITE_DATABASE_ID,
        'image_cache',
        cacheKey
      );
      
      // Return cached result if less than 24 hours old
      const cacheAge = Date.now() - new Date(cachedResult.$createdAt).getTime();
      if (cacheAge < 24 * 60 * 60 * 1000) {
        log('📋 Returning cached result');
        return res.json({
          images: cachedResult.images,
          cached: true,
          retailer: cachedResult.retailer
        });
      }
    } catch (e) {
      // Cache miss, continue with scraping
      log('🔄 Cache miss, proceeding with scraping');
    }

    // Determine retailer and scrape accordingly
    const hostname = new URL(productUrl).hostname.toLowerCase();
    let images = [];
    let retailer = 'unknown';

    if (hostname.includes('amazon.')) {
      retailer = 'amazon';
      images = await scrapeAmazon(productUrl, options, log);
    } else if (hostname.includes('target.')) {
      retailer = 'target';
      images = await scrapeTarget(productUrl, options, log);
    } else if (hostname.includes('walmart.')) {
      retailer = 'walmart';
      images = await scrapeWalmart(productUrl, options, log);
    } else if (hostname.includes('bestbuy.')) {
      retailer = 'bestbuy';
      images = await scrapeBestBuy(productUrl, options, log);
    } else {
      retailer = 'generic';
      images = await scrapeGeneric(productUrl, options, log);
    }

    // Apply image resizing if requested
    if (options.width || options.height) {
      images = resizeImages(images, options);
    }

    // Cache the result
    try {
      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID,
        'image_cache',
        cacheKey,
        {
          productUrl,
          productName,
          retailer,
          images,
          hostname
        }
      );
      log('💾 Result cached successfully');
    } catch (cacheError) {
      error('Failed to cache result:', cacheError);
    }

    log(`📸 Successfully scraped ${images.length} images from ${retailer}`);
    
    return res.json({
      images,
      cached: false,
      retailer,
      count: images.length
    });

  } catch (err) {
    error('Scraping error:', err);
    
    // Return placeholder on error
    const encodedName = encodeURIComponent(req.body?.productName || 'Product');
    return res.json({
      images: [`https://placehold.co/150x150/e5e7eb/374151?text=${encodedName}&font=lato`],
      error: err.message,
      retailer: 'fallback'
    });
  }
};

// Amazon scraping function
async function scrapeAmazon(productUrl, options, log) {
  log('🏪 Scraping Amazon product');
  
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = await response.text();
    const images = [];
    
    // Extract ASIN from URL
    const asinMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
    if (asinMatch) {
      const asin = asinMatch[1] || asinMatch[2];
      
      // Generate Amazon image URLs
      images.push(
        `https://m.media-amazon.com/images/I/${asin}._AC_SL1500_.jpg`,
        `https://m.media-amazon.com/images/I/${asin}._AC_SX679_.jpg`,
        `https://images-na.ssl-images-amazon.com/images/I/${asin}._AC_UL1500_.jpg`
      );
    }
    
    // Parse HTML for additional images
    const imageRegex = /"hiRes":"([^"]+)"/g;
    let match;
    while ((match = imageRegex.exec(html)) !== null) {
      if (match[1] && !images.includes(match[1])) {
        images.push(match[1]);
      }
    }
    
    // Parse JSON-LD data
    const jsonLdRegex = /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs;
    let jsonMatch;
    while ((jsonMatch = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        if (data.image) {
          const imageUrls = Array.isArray(data.image) ? data.image : [data.image];
          imageUrls.forEach(img => {
            const url = typeof img === 'string' ? img : img.url;
            if (url && !images.includes(url)) {
              images.push(url);
            }
          });
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }
    
    log(`📸 Amazon: Found ${images.length} images`);
    return images.slice(0, 10); // Limit to 10 images
    
  } catch (error) {
    log(`❌ Amazon scraping failed: ${error.message}`);
    return [];
  }
}

// Target scraping function
async function scrapeTarget(productUrl, options, log) {
  log('🎯 Scraping Target product');
  
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const images = [];
    
    // Target image selectors
    const imageRegexes = [
      /"src":"([^"]*target\.scene7\.com[^"]*)"/g,
      /"url":"([^"]*target\.scene7\.com[^"]*)"/g,
      /data-src="([^"]*target\.scene7\.com[^"]*)"/g
    ];
    
    imageRegexes.forEach(regex => {
      let match;
      while ((match = regex.exec(html)) !== null) {
        if (match[1] && !images.includes(match[1])) {
          images.push(match[1].replace(/\\u002F/g, '/'));
        }
      }
    });
    
    log(`📸 Target: Found ${images.length} images`);
    return images.slice(0, 10);
    
  } catch (error) {
    log(`❌ Target scraping failed: ${error.message}`);
    return [];
  }
}

// Walmart scraping function
async function scrapeWalmart(productUrl, options, log) {
  log('🛒 Scraping Walmart product');
  
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const images = [];
    
    // Walmart image patterns
    const imageRegexes = [
      /"url":"([^"]*i5\.walmartimages\.com[^"]*)"/g,
      /"src":"([^"]*i5\.walmartimages\.com[^"]*)"/g
    ];
    
    imageRegexes.forEach(regex => {
      let match;
      while ((match = regex.exec(html)) !== null) {
        if (match[1] && !images.includes(match[1])) {
          images.push(match[1].replace(/\\u002F/g, '/'));
        }
      }
    });
    
    log(`📸 Walmart: Found ${images.length} images`);
    return images.slice(0, 10);
    
  } catch (error) {
    log(`❌ Walmart scraping failed: ${error.message}`);
    return [];
  }
}

// Best Buy scraping function
async function scrapeBestBuy(productUrl, options, log) {
  log('🏪 Scraping Best Buy product');
  
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const images = [];
    
    // Best Buy image patterns
    const imageRegexes = [
      /"src":"([^"]*pisces\.bbystatic\.com[^"]*)"/g,
      /"url":"([^"]*pisces\.bbystatic\.com[^"]*)"/g
    ];
    
    imageRegexes.forEach(regex => {
      let match;
      while ((match = regex.exec(html)) !== null) {
        if (match[1] && !images.includes(match[1])) {
          images.push(match[1].replace(/\\u002F/g, '/'));
        }
      }
    });
    
    log(`📸 Best Buy: Found ${images.length} images`);
    return images.slice(0, 10);
    
  } catch (error) {
    log(`❌ Best Buy scraping failed: ${error.message}`);
    return [];
  }
}

// Generic scraping function
async function scrapeGeneric(productUrl, options, log) {
  log('🌐 Generic product scraping');
  
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const images = [];
    
    // Generic image extraction patterns
    const imageRegexes = [
      /<img[^>]+src="([^"]+)"[^>]*>/gi,
      /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/gi,
      /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/gi
    ];
    
    imageRegexes.forEach(regex => {
      let match;
      while ((match = regex.exec(html)) !== null) {
        const imageUrl = match[1];
        if (imageUrl && 
            imageUrl.startsWith('http') && 
            !imageUrl.includes('logo') &&
            !imageUrl.includes('icon') &&
            !images.includes(imageUrl)) {
          images.push(imageUrl);
        }
      }
    });
    
    log(`📸 Generic: Found ${images.length} images`);
    return images.slice(0, 10);
    
  } catch (error) {
    log(`❌ Generic scraping failed: ${error.message}`);
    return [];
  }
}

// Image resizing function using proxy
function resizeImages(images, options) {
  const { width = 150, height = 150 } = options;
  
  return images.map(imageUrl => {
    const encodedUrl = encodeURIComponent(imageUrl);
    return `https://images.weserv.nl/?url=${encodedUrl}&w=${width}&h=${height}&fit=cover&errorredirect=404`;
  });
}
