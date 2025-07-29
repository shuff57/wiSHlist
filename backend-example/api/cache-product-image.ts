// Example backend API endpoint for image caching
// This would be implemented in your backend (Node.js/Express, Python/Flask, etc.)

import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const router = express.Router();

// Cache directory
const CACHE_DIR = path.join(__dirname, 'cached-images');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * POST /api/cache-product-image
 * Body: { url: string, name: string }
 * Returns: { imageUrl: string, cached: boolean }
 */
router.post('/cache-product-image', async (req, res) => {
  try {
    const { url, name } = req.body;
    
    if (!url || !name) {
      return res.status(400).json({ error: 'URL and name are required' });
    }
    
    // Generate cache key
    const cacheKey = crypto.createHash('md5').update(url).digest('hex');
    const cachedImagePath = path.join(CACHE_DIR, `${cacheKey}.jpg`);
    const publicImageUrl = `/cached-images/${cacheKey}.jpg`;
    
    // Check if image is already cached
    if (fs.existsSync(cachedImagePath)) {
      return res.json({
        imageUrl: publicImageUrl,
        cached: true
      });
    }
    
    // Extract Amazon product image
    const imageUrl = await extractAmazonImage(url);
    
    if (imageUrl) {
      // Download and cache the image
      const success = await downloadAndCacheImage(imageUrl, cachedImagePath);
      
      if (success) {
        return res.json({
          imageUrl: publicImageUrl,
          cached: false
        });
      }
    }
    
    // Fallback to placeholder
    const placeholder = `https://placehold.co/150x150/e5e7eb/374151?text=${encodeURIComponent(name.substring(0, 12))}&font=lato`;
    
    res.json({
      imageUrl: placeholder,
      cached: false
    });
    
  } catch (error) {
    console.error('Error caching product image:', error);
    res.status(500).json({ error: 'Failed to cache image' });
  }
});

/**
 * Extract the actual product image from Amazon page
 */
async function extractAmazonImage(productUrl: string): Promise<string | null> {
  try {
    // Method 1: Try direct ASIN-based image URLs
    const asinMatch = productUrl.match(/\/dp\/([A-Z0-9]{10})|\/gp\/product\/([A-Z0-9]{10})|asin=([A-Z0-9]{10})|\/([A-Z0-9]{10})(?:\/|\?|$)/i);
    
    if (asinMatch) {
      const asin = asinMatch[1] || asinMatch[2] || asinMatch[3] || asinMatch[4];
      
      // Try different Amazon image URLs
      const imageUrls = [
        `https://images.amazon.com/images/P/${asin}.01.L.jpg`,
        `https://m.media-amazon.com/images/I/${asin}._AC_UL320_.jpg`,
        `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SX300_.jpg`
      ];
      
      for (const imageUrl of imageUrls) {
        if (await isImageAccessible(imageUrl)) {
          return imageUrl;
        }
      }
    }
    
    // Method 2: Scrape the product page for the main image
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Look for image in various places
    const imageRegexes = [
      /"large":"([^"]+)"/,
      /"hiRes":"([^"]+)"/,
      /data-old-hires="([^"]+)"/,
      /id="landingImage"[^>]*src="([^"]+)"/
    ];
    
    for (const regex of imageRegexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        const imageUrl = match[1].replace(/\\u[\dA-F]{4}/gi, match => 
          String.fromCharCode(parseInt(match.replace('\\u', ''), 16))
        );
        
        if (await isImageAccessible(imageUrl)) {
          return imageUrl;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting Amazon image:', error);
    return null;
  }
}

/**
 * Check if an image URL is accessible
 */
async function isImageAccessible(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * Download and cache an image
 */
async function downloadAndCacheImage(imageUrl: string, cachePath: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return false;
    
    const buffer = await response.buffer();
    fs.writeFileSync(cachePath, buffer);
    
    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    return false;
  }
}

export default router;
