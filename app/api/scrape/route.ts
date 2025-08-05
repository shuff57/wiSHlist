// Location: app/api/scrape/route.ts
// Last Updated: Monday, August 4, 2025 at 5:25 PM PDT

import { NextRequest, NextResponse } from 'next/server'
import got from 'got'
import { HttpsProxyAgent } from 'hpagent'

// Initialize metascraper with the plugins you need for link previews
const metascraper = require('metascraper')([
  require('metascraper-title')(),
  require('metascraper-description')(),
  require('metascraper-image')(),
  require('metascraper-url')(),
])

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

    // 6. Return the enhanced scraped data
    return NextResponse.json(enhancedMetadata)

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
