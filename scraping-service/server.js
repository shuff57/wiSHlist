const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// In-memory cache (in production, use Redis)
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Product image scraping endpoint
app.post('/api/scrape-images', async (req, res) => {
  const { productUrl, productName, options = {} } = req.body;
  
  if (!productUrl) {
    return res.status(400).json({ error: 'Product URL is required' });
  }

  console.log(`🔍 Scraping images for: ${productUrl}`);

  // Check cache first
  const cacheKey = Buffer.from(productUrl).toString('base64');
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('📋 Returning cached result');
    return res.json({
      ...cached.data,
      cached: true
    });
  }

  try {
    // Determine retailer and scrape
    const hostname = new URL(productUrl).hostname.toLowerCase();
    let images = [];
    let retailer = 'unknown';

    if (hostname.includes('amazon.')) {
      retailer = 'amazon';
      images = await scrapeAmazon(productUrl, options);
    } else if (hostname.includes('target.')) {
      retailer = 'target';
      images = await scrapeTarget(productUrl, options);
    } else if (hostname.includes('walmart.')) {
      retailer = 'walmart';
      images = await scrapeWalmart(productUrl, options);
    } else if (hostname.includes('bestbuy.')) {
      retailer = 'bestbuy';
      images = await scrapeBestBuy(productUrl, options);
    } else {
      retailer = 'generic';
      images = await scrapeGeneric(productUrl, options);
    }

    // Apply image resizing if requested (but not for placeholder images)
    if (options.width || options.height) {
      images = images.map(imageUrl => {
        // Don't resize placeholder images - they're already the right size
        if (imageUrl.includes('placehold.co') || imageUrl.includes('placeholder')) {
          return imageUrl;
        }
        // Resize other images through proxy
        return resizeImage(imageUrl, options);
      });
    }

    // If no images found, provide fallback
    if (images.length === 0) {
      console.log(`⚠️ No images found for ${retailer}, providing placeholder`);
      const encodedName = encodeURIComponent(productName || retailer);
      images = [`https://placehold.co/150x150/e5e7eb/374151?text=${encodedName}&font=lato`];
    }

    const result = {
      images,
      retailer,
      count: images.length,
      cached: false
    };

    // Cache the result
    cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    console.log(`📸 Successfully scraped ${images.length} images from ${retailer}`);
    res.json(result);

  } catch (error) {
    console.error('Scraping error:', error);
    
    const encodedName = encodeURIComponent(productName || 'Product');
    res.json({
      images: [`https://placehold.co/150x150/e5e7eb/374151?text=${encodedName}&font=lato`],
      error: error.message,
      retailer: 'fallback',
      cached: false
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    cacheSize: cache.size
  });
});

// Cache stats endpoint
app.get('/api/cache-stats', (req, res) => {
  res.json({
    size: cache.size,
    keys: Array.from(cache.keys()).slice(0, 10) // First 10 keys for debugging
  });
});

// Scraping functions (same as Appwrite implementation)
async function scrapeAmazon(productUrl, options) {
  console.log('🏪 Scraping Amazon product');
  
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const html = await response.text();
    const images = [];
    
    console.log(`📄 Amazon HTML length: ${html.length} characters`);
    
    // Try multiple patterns for Amazon images
    const imageRegexes = [
      // High-res images from HTML
      /"hiRes":"([^"]+)"/g,
      /"large":"([^"]+)"/g,
      
      // Alternative image patterns
      /"src":"([^"]*images-na\.ssl-images-amazon\.com[^"]*\.jpg[^"]*)"/g,
      /"src":"([^"]*m\.media-amazon\.com[^"]*\.jpg[^"]*)"/g,
      /"url":"([^"]*images-na\.ssl-images-amazon\.com[^"]*\.jpg[^"]*)"/g,
      /"url":"([^"]*m\.media-amazon\.com[^"]*\.jpg[^"]*)"/g,
      
      // JSON-LD structured data
      /"image":\s*"([^"]+\.jpg[^"]*)"/g,
      /"@type":\s*"ImageObject"[^}]*"url":\s*"([^"]+\.jpg[^"]*)"/g,
      
      // Open Graph images
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+\.jpg[^"']*)["']/gi
    ];
    
    imageRegexes.forEach((regex, index) => {
      let match;
      let count = 0;
      while ((match = regex.exec(html)) !== null && count < 20) {
        let imageUrl = match[1];
        if (imageUrl && 
            imageUrl.startsWith('http') && 
            imageUrl.includes('.jpg') &&
            !imageUrl.includes('icon') &&
            !imageUrl.includes('logo') &&
            !images.includes(imageUrl)) {
          
          // Clean up the URL
          imageUrl = imageUrl.replace(/\\u002F/g, '/').replace(/\\/g, '');
          images.push(imageUrl);
          console.log(`🖼️ Found Amazon image (regex ${index}): ${imageUrl}`);
        }
        count++;
      }
    });
    
    // If no images found from HTML parsing, try ASIN-based URLs as fallback
    if (images.length === 0) {
      const asinMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})/);
      if (asinMatch) {
        const asin = asinMatch[1] || asinMatch[2];
        console.log(`🔍 Trying ASIN-based images for: ${asin}`);
        
        // These are common Amazon image patterns, but may not always work
        const asinImages = [
          `https://images-na.ssl-images-amazon.com/images/I/${asin}.jpg`,
          `https://m.media-amazon.com/images/I/${asin}._AC_SL1000_.jpg`,
          `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.L.jpg`
        ];
        
        images.push(...asinImages);
      }
    }
    
    console.log(`📸 Amazon scraping found ${images.length} images`);
    return images.slice(0, 10);
  } catch (error) {
    console.error(`❌ Amazon scraping failed: ${error.message}`);
    return [];
  }
}

async function scrapeTarget(productUrl, options) {
  console.log('🎯 Scraping Target product');
  
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const html = await response.text();
    const images = [];
    
    // Try multiple patterns for Target images
    const imageRegexes = [
      // Current Target CDN patterns
      /"src":"([^"]*target\.scene7\.com[^"]*)"/g,
      /"url":"([^"]*target\.scene7\.com[^"]*)"/g,
      /"href":"([^"]*target\.scene7\.com[^"]*)"/g,
      
      // Alternative Target image patterns
      /"src":"([^"]*target\.com[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
      /"url":"([^"]*target\.com[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/gi,
      
      // Generic high-res image patterns
      /"([^"]*\/images\/[^"]*\d{3,4}x\d{3,4}[^"]*\.(?:jpg|jpeg|png|webp))"/gi,
      /"([^"]*\.(?:jpg|jpeg|png|webp)\?[^"]*(?:width|w)=\d{3,4}[^"]*)"/gi,
      
      // JSON-LD structured data
      /"image":\s*"([^"]+)"/g,
      /"@type":\s*"ImageObject"[^}]*"url":\s*"([^"]+)"/g
    ];
    
    console.log(`📄 Target HTML length: ${html.length} characters`);
    
    imageRegexes.forEach((regex, index) => {
      let match;
      let count = 0;
      while ((match = regex.exec(html)) !== null && count < 20) {
        const imageUrl = match[1];
        if (imageUrl && 
            imageUrl.startsWith('http') && 
            !imageUrl.includes('logo') &&
            !imageUrl.includes('icon') &&
            !images.includes(imageUrl)) {
          const cleanUrl = imageUrl.replace(/\\u002F/g, '/').replace(/\\/g, '');
          images.push(cleanUrl);
          console.log(`🖼️ Found Target image (regex ${index}): ${cleanUrl}`);
        }
        count++;
      }
    });
    
    // If no images found, try Open Graph
    if (images.length === 0) {
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      if (ogImageMatch) {
        images.push(ogImageMatch[1]);
        console.log(`🖼️ Found Target OG image: ${ogImageMatch[1]}`);
      }
    }
    
    // If no valid product images found, return fallback
    if (images.length === 0 || images.every(img => img.includes('logo') || img.includes('icon') || img.includes('chrome'))) {
      console.log('⚠️ No valid Target product images found, returning placeholder');
      return [];
    }
    
    // Filter out logos and icons
    const productImages = images.filter(img => 
      !img.includes('logo') && 
      !img.includes('icon') && 
      !img.includes('chrome') &&
      !img.includes('android')
    );
    
    console.log(`📸 Target scraping found ${productImages.length} product images`);
    return productImages.slice(0, 10);
  } catch (error) {
    console.error(`❌ Target scraping failed: ${error.message}`);
    return [];
  }
}

async function scrapeWalmart(productUrl, options) {
  console.log('🛒 Scraping Walmart product');
  
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const images = [];
    
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
    
    return images.slice(0, 10);
  } catch (error) {
    console.error(`❌ Walmart scraping failed: ${error.message}`);
    return [];
  }
}

async function scrapeBestBuy(productUrl, options) {
  console.log('🏪 Scraping Best Buy product');
  
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const images = [];
    
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
    
    return images.slice(0, 10);
  } catch (error) {
    console.error(`❌ Best Buy scraping failed: ${error.message}`);
    return [];
  }
}

async function scrapeGeneric(productUrl, options) {
  console.log('🌐 Generic product scraping');
  
  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const images = [];
    
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
    
    return images.slice(0, 10);
  } catch (error) {
    console.error(`❌ Generic scraping failed: ${error.message}`);
    return [];
  }
}

function resizeImage(imageUrl, options) {
  const { width = 150, height = 150 } = options;
  
  // Don't resize placeholder images
  if (imageUrl.includes('placehold.co') || imageUrl.includes('placeholder')) {
    return imageUrl;
  }
  
  // For potentially problematic URLs, try direct first, then fallback to resize service
  const encodedUrl = encodeURIComponent(imageUrl);
  return `https://images.weserv.nl/?url=${encodedUrl}&w=${width}&h=${height}&fit=cover&errorredirect=404`;
}

// Legacy function for backward compatibility
function resizeImages(images, options) {
  return images.map(imageUrl => resizeImage(imageUrl, options));
}

app.listen(PORT, () => {
  console.log(`🚀 Product scraping service running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
});
