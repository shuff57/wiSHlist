// Location: app/api/scrape/route.ts
// Last Updated: Monday, August 4, 2025 at 5:25 PM PDT

import { NextRequest, NextResponse } from 'next/server'
import got from 'got'
import { HttpsProxyAgent } from 'hpagent'
import { Client, Databases, Query, ID } from 'appwrite'
import crypto from 'crypto'

// Initialize metascraper with the plugins you need for link previews
const metascraper = require('metascraper')([
  require('metascraper-title')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-url')(),
])

// Appwrite configuration for server-side operations
const client = new Client()
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
const apiKey = process.env.APPWRITE_API_KEY_CACHE || process.env.APPWRITE_API_KEY // Use cache-specific key or fallback

if (!endpoint || !projectId) {
  throw new Error('Missing Appwrite configuration. Please check your .env file and ensure APPWRITE_ENDPOINT and APPWRITE_PROJECT_ID are set.')
}

// Configure client with proper server-side authentication
client
  .setEndpoint(endpoint)
  .setProject(projectId)

// Set API key using the setKey method (for Appwrite v18+)
if (apiKey) {
  try {
    // Try the setKey method first
    if (typeof (client as any).setKey === 'function') {
      (client as any).setKey(apiKey)
    } else {
      // Fallback to header method
      client.headers = client.headers || {}
      client.headers['X-Appwrite-Key'] = apiKey
    }
  } catch (error) {
    console.warn('Failed to set API key:', error)
  }
} else {
  console.warn('APPWRITE_API_KEY not found. Cache operations may fail due to permissions.')
}

const databases = new Databases(client)

// Database configuration
const DATABASE_ID = '688189ad000ad6dd9410' // Your existing database ID
const URL_CACHE_COLLECTION_ID = '68915fa8003d3174638e' // URL Cache collection ID
const CACHE_EXPIRY_DAYS = 7 // Cache expires after 7 days
const SIMILARITY_THRESHOLD = 0.8 // 80% similarity to use cached result

interface CacheEntry {
  $id?: string
  url: string
  normalizedUrl: string
  urlHash: string // Short hash for indexing
  productId: string | null
  metadata: any
  timestamp: number
  hitCount: number
}

// Cache management functions using Appwrite
async function loadCache(): Promise<Map<string, CacheEntry>> {
  try {
    const response = await databases.listDocuments(DATABASE_ID, URL_CACHE_COLLECTION_ID, [
      Query.limit(1000) // Adjust limit as needed
    ])
    
    const cache = new Map<string, CacheEntry>()
    response.documents.forEach((doc: any) => {
      cache.set(doc.normalizedUrl, {
        $id: doc.$id,
        url: doc.url,
        normalizedUrl: doc.normalizedUrl,
        urlHash: doc.urlHash || createUrlHash(doc.normalizedUrl), // Fallback for existing entries
        productId: doc.productId,
        metadata: JSON.parse(doc.metadata),
        timestamp: doc.timestamp,
        hitCount: doc.hitCount
      })
    })
    
    return cache
  } catch (error) {
    console.log('Failed to load cache from database:', error)
    return new Map()
  }
}

async function saveCache(cache: Map<string, CacheEntry>): Promise<void> {
  // For database, we'll save individual entries as they're updated
  // This function is kept for compatibility but not used the same way
  console.log('Cache updated in database')
}

async function saveCacheEntry(entry: CacheEntry): Promise<void> {
  try {
    const data = {
      url: entry.url,
      normalizedUrl: entry.normalizedUrl,
      urlHash: entry.urlHash,
      productId: entry.productId,
      metadata: JSON.stringify(entry.metadata),
      timestamp: entry.timestamp,
      hitCount: entry.hitCount
    }

    if (entry.$id) {
      // Update existing entry
      await databases.updateDocument(DATABASE_ID, URL_CACHE_COLLECTION_ID, entry.$id, data)
    } else {
      // Create new entry
      await databases.createDocument(DATABASE_ID, URL_CACHE_COLLECTION_ID, ID.unique(), data)
    }
  } catch (error) {
    console.error('Failed to save cache entry:', error)
  }
}

function createUrlHash(normalizedUrl: string): string {
  return crypto.createHash('sha256').update(normalizedUrl).digest('hex').substring(0, 64)
}

function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // For Amazon URLs, extract the core product identifier
    if (urlObj.hostname.includes('amazon.')) {
      // Extract ASIN/product ID from Amazon URLs
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/)
      if (asinMatch) {
        return `amazon:${asinMatch[1]}`
      }
      
      // For other Amazon URLs, use domain + path without query params
      return `${urlObj.hostname}${urlObj.pathname}`.toLowerCase()
    }
    
    // For other sites, remove query parameters and fragments
    return `${urlObj.hostname}${urlObj.pathname}`.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

function extractProductId(url: string): string | null {
  // Amazon ASIN extraction
  const amazonMatch = url.match(/\/dp\/([A-Z0-9]{10})/)
  if (amazonMatch) {
    return amazonMatch[1]
  }
  
  // Add more product ID patterns for other sites as needed
  return null
}

function calculateUrlSimilarity(url1: string, url2: string): number {
  const norm1 = normalizeUrl(url1)
  const norm2 = normalizeUrl(url2)
  
  // Exact match
  if (norm1 === norm2) {
    return 1.0
  }
  
  // Check if they share the same product ID
  const productId1 = extractProductId(url1)
  const productId2 = extractProductId(url2)
  
  if (productId1 && productId2 && productId1 === productId2) {
    return 0.95 // Very high similarity for same product ID
  }
  
  // Basic string similarity (Jaccard similarity)
  const set1 = new Set(norm1.split(''))
  const set2 = new Set(norm2.split(''))
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return intersection.size / union.size
}

function findSimilarCachedUrl(targetUrl: string, cache: Map<string, CacheEntry>): CacheEntry | null {
  let bestMatch: CacheEntry | null = null
  let bestSimilarity = 0
  
  const now = Date.now()
  const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
  
  for (const entry of cache.values()) {
    // Skip expired entries
    if (now - entry.timestamp > expiryTime) {
      continue
    }
    
    const similarity = calculateUrlSimilarity(targetUrl, entry.url)
    
    if (similarity >= SIMILARITY_THRESHOLD && similarity > bestSimilarity) {
      bestSimilarity = similarity
      bestMatch = entry
    }
  }
  
  return bestMatch
}

async function cleanExpiredCache(): Promise<void> {
  try {
    const now = Date.now()
    const expiryTime = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    const cutoffTimestamp = now - expiryTime
    
    // Query for expired entries
    const response = await databases.listDocuments(DATABASE_ID, URL_CACHE_COLLECTION_ID, [
      Query.lessThan('timestamp', cutoffTimestamp),
      Query.limit(100) // Clean in batches
    ])
    
    // Delete expired entries
    for (const doc of response.documents) {
      await databases.deleteDocument(DATABASE_ID, URL_CACHE_COLLECTION_ID, doc.$id)
    }
    
    if (response.documents.length > 0) {
      console.log(`Cleaned ${response.documents.length} expired cache entries`)
    }
  } catch (error) {
    console.error('Failed to clean expired cache:', error)
  }
}

// --- START: IP-based Rate Limiter ---
// This simple in-memory store limits requests from a single IP.
// NOTE: For a large-scale production app on a serverless platform like Vercel,
// consider a centralized service like Upstash (Redis) for perfect rate limiting.
const rateLimitStore = new Map<string, { count: number; expiry: number }>()

const RATE_LIMIT_WINDOW = Number(process.env.SCRAPE_RATE_LIMIT_WINDOW) || 60000 // 1 minute
const RATE_LIMIT_MAX = Number(process.env.SCRAPE_RATE_LIMIT_MAX) || 10 // 10 requests
// --- END: Rate Limiter ---

// Amazon-specific extraction functions
function extractAmazonProductImage(html: string): string | null {
  // Multiple patterns to find Amazon product images
  const imagePatterns = [
    // Main product image patterns
    /"hiRes":"([^"]+)"/,
    /"large":"([^"]+)"/,
    /data-old-hires="([^"]+)"/,
    /data-a-dynamic-image="[^"]*([^"]+\.jpg[^"]*)"/, 
    // Fallback patterns
    /<img[^>]+id="landingImage"[^>]+src="([^"]+)"/,
    /<img[^>]+class="[^"]*a-dynamic-image[^"]*"[^>]+src="([^"]+)"/,
    // Open Graph image as fallback
    /<meta property="og:image" content="([^"]+)"/
  ]
  
  for (const pattern of imagePatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      let imageUrl = match[1]
      
      // Clean up the URL
      imageUrl = imageUrl.replace(/\\u0026/g, '&')
      imageUrl = imageUrl.replace(/\\/g, '')
      
      // Ensure it's a valid image URL
      if (imageUrl.includes('.jpg') || imageUrl.includes('.jpeg') || imageUrl.includes('.png') || imageUrl.includes('.webp')) {
        // Make sure it's a full URL
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl
        } else if (imageUrl.startsWith('/')) {
          imageUrl = 'https://amazon.com' + imageUrl
        }
        
        return imageUrl
      }
    }
  }
  
  return null
}

function extractAmazonPrice(html: string): string | null {
  // Multiple price patterns for Amazon
  const pricePatterns = [
    // Primary price displays
    /<span class="a-price-whole">([^<]+)<\/span>/,
    /<span class="a-offscreen">\$?([0-9,]+\.?[0-9]*)<\/span>/,
    /<span[^>]*class="[^"]*a-price[^"]*"[^>]*>\s*\$?([0-9,]+\.?[0-9]*)/,
    
    // Deal and sale prices
    /<span[^>]*class="[^"]*a-price-range[^"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)/,
    /"priceAmount":([0-9,]+\.?[0-9]*)/,
    
    // Alternative patterns
    /\$([0-9,]+\.[0-9]{2})/,
    /USD\s+([0-9,]+\.?[0-9]*)/,
    
    // List price patterns
    /<span[^>]*class="[^"]*a-text-strike[^"]*"[^>]*>\$?([0-9,]+\.?[0-9]*)/
  ]
  
  for (const pattern of pricePatterns) {
    const match = html.match(pattern)
    if (match && match[1]) {
      let price = match[1].replace(/[^0-9.]/g, '')
      
      if (price && !isNaN(parseFloat(price))) {
        // Format the price
        const numPrice = parseFloat(price)
        return `$${numPrice.toFixed(2)}`
      }
    }
  }
  
  return null
}

export async function GET(request: NextRequest) {
  // --- Rate Limiting Logic ---
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (record && now < record.expiry) {
    if (record.count >= RATE_LIMIT_MAX) {
      return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    }
    record.count++
  } else {
    // Start a new window for this IP
    rateLimitStore.set(ip, { count: 1, expiry: now + RATE_LIMIT_WINDOW })
  }
  // --- End Rate Limiting ---

  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL parameter is missing.' }, { status: 400 })
  }

  // Load cache and check for existing or similar URLs
  const cache = await loadCache()
  const normalizedUrl = normalizeUrl(targetUrl)
  
  // Clean expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to clean cache
    cleanExpiredCache() // Run in background, don't await
  }
  
  // Check for exact match in cache
  let cachedEntry = cache.get(normalizedUrl)
  
  // If no exact match, look for similar URLs
  if (!cachedEntry) {
    const similarEntry = findSimilarCachedUrl(targetUrl, cache)
    if (similarEntry) {
      cachedEntry = similarEntry
    }
  }
  
  if (cachedEntry) {
    // Update hit count and return cached result
    cachedEntry.hitCount++
    console.log(`Cache hit for ${targetUrl} (similar to ${cachedEntry.url}), hit count: ${cachedEntry.hitCount}`)
    
    // Update hit count in database
    await saveCacheEntry(cachedEntry)
    
    // Add cache info to response
    const response = {
      ...cachedEntry.metadata,
      _cache: {
        hit: true,
        originalUrl: cachedEntry.url,
        similarity: calculateUrlSimilarity(targetUrl, cachedEntry.url),
        hitCount: cachedEntry.hitCount,
        cachedAt: new Date(cachedEntry.timestamp).toISOString()
      }
    }
    
    return NextResponse.json(response)
  }

  // No cache hit, proceed with scraping
  console.log(`Cache miss for ${targetUrl}, proceeding with scraping`)

  // 1. Load your specific Bright Data credentials from your .env.local file
  const proxyHost = process.env.BRIGHTDATA_ENDPOINT
  const proxyPort = Number(process.env.BRIGHTDATA_PORT)
  const proxyUsername = process.env.BRIGHTDATA_USERNAME
  const proxyPassword = process.env.BRIGHTDATA_PASSWORD

  if (!proxyHost || !proxyPort || !proxyUsername || !proxyPassword) {
    console.error('Bright Data environment variables are not properly set.')
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 })
  }

  // 2. Construct the full proxy URL and configure the proxy agent
  const proxyUrl = `http://${proxyUsername}:${proxyPassword}@${proxyHost}:${proxyPort}`
  const agent = {
    https: new HttpsProxyAgent({ keepAlive: true, proxy: proxyUrl }),
  }

  try {
    // 3. Make the request with 'got', using the proxy, a realistic User-Agent, and timeouts
    const { body: html, url } = await got(targetUrl, {
      agent, // This routes the request through your Bright Data proxy
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      },
      timeout: { request: 15000 }, // 15-second timeout for the request
      retry: { limit: 2 }, // Retry up to 2 times on network failure
      https: {
        rejectUnauthorized: false // Accept self-signed certificates from proxy
      }
    })

    // 4. Run metascraper on the successfully fetched HTML
    const metadata = await metascraper({ html, url })

    // 5. Enhanced Amazon-specific extraction
    let enhancedMetadata = { ...metadata }
    
    if (targetUrl.includes('amazon.')) {
      // Extract Amazon product image
      const amazonImage = extractAmazonProductImage(html)
      if (amazonImage) {
        enhancedMetadata.image = amazonImage
      }
      
      // Extract Amazon price
      const amazonPrice = extractAmazonPrice(html)
      if (amazonPrice) {
        enhancedMetadata.price = amazonPrice
      }
    }

    // 6. Save to cache
    const newCacheEntry: CacheEntry = {
      url: targetUrl,
      normalizedUrl: normalizedUrl,
      urlHash: createUrlHash(normalizedUrl),
      productId: extractProductId(targetUrl),
      metadata: enhancedMetadata,
      timestamp: Date.now(),
      hitCount: 1
    }
    
    // Save to database
    await saveCacheEntry(newCacheEntry)
    
    console.log(`Cached new entry for ${targetUrl}`)

    // 7. Return the enhanced scraped data with cache info
    const response = {
      ...enhancedMetadata,
      _cache: {
        hit: false,
        cachedAt: new Date().toISOString()
      }
    }
    
    return NextResponse.json(response)

  } catch (error: any) {
    // Log the detailed error on the server for debugging purposes
    console.error(`Scraping failed for ${targetUrl} using Bright Data`, {
      errorMessage: error.message,
      statusCode: error.response?.statusCode,
    })

    // Return a generic error to the client
    return NextResponse.json(
      { error: `Failed to retrieve preview from ${targetUrl}.` },
      { status: 500 } // Use 500 for a general server-side failure
    )
  }
}

// Keep POST method for backward compatibility with existing frontend code
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Create a new URL with the target URL as a search parameter
    const requestUrl = new URL(request.url)
    requestUrl.searchParams.set('url', url)
    
    // Create a new request object for GET handler
    const getRequest = new NextRequest(requestUrl.toString(), {
      method: 'GET',
      headers: request.headers,
    })
    
    // Delegate to GET handler
    return await GET(getRequest)
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    )
  }
}
